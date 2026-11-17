CertiBuy — Deployment & Operations

> **Capstone deployment (decided):** one Next.js app on **Vercel Hobby** (personal, non-commercial demonstration) and **Supabase Free** (`certibuy-demo` + `certibuy-dev`), local development on the Supabase CLI. No paid services. Jobs are triggered from Ops → Jobs. Payments, payouts, courier, grading and email are simulated, so the go-live items for real money (§2, §9) apply only to the later production move described in `docs/architecture.md` §19. This document remains the production reference.

## 1. Environments

| Env | Purpose | Data | Demo controls |
| --- | --- | --- | --- |
| local | development | seeded demo data, reset freely | on |
| staging | UAT, demos to partners | copied/seeded | on |
| production | real users | real | **off** (`demo_mode:false`, `simulate_payout_failure:false`, `sim_day_offset:0`) |

Production must open with: `demo_mode = false`, `sim_day_offset = 0`, `simulate_payout_failure = false`, and the demo reset endpoint restricted to admins. Advancing the clock in production would age every listing and trigger real payouts.

## 1b. Database connection strings

Prisma uses two URLs (`packages/db/.env` or the hosting env):

| Variable | Local (Supabase CLI) | Hosted (Supabase Free / Pro) |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` | `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true` (transaction-mode pooler) |
| `DIRECT_URL` | same as `DATABASE_URL` | `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres` (session-mode direct, used for migrations) |

`directUrl` in the Prisma datasource lets `prisma migrate` bypass PgBouncer (which breaks prepared statements in transaction mode). Both variables must be set in every environment.

## 2. What you must configure before the first real user

| Item | Notes |
| --- | --- |
| Auth | email + password with OTP verification; enable Google/Microsoft/SSO if needed; decide on MFA (recommended for `ops`) |
| Sender domain | verified so transactional mail lands in the inbox, not spam |
| `APP_PUBLIC_URL` | the public base URL used in every email link |
| `SUPPORT_EMAIL` | the customer-care inbox |
| Payments | provider keys server-side; webhook endpoint registered; test mode verified end to end |
| Payout rail | transfer keys, payee-name verification (penny drop) |
| Courier | account + webhook secret; status mapping to `dispatched/in_transit/delivered` |
| Storage | a private bucket for seller photos, inspection photos and signatures; signed URLs with short TTL |
| Scheduler | daily 00:30 Asia/Kolkata → `runDailyJobs` with `SCHEDULER_SECRET`; weekly Monday → `recalcLiquidity` |
| Backups | daily database snapshot, 30-day retention; object storage versioning |
| Monitoring | error tracking on server functions, uptime check on `/`, alert on job non-200 |

## 3. Build & release

```bash
npm ci
npm run build            # must exit 0
# deploy the built app + backend functions together — they share the schema
```

Release checklist:

1. Schema changes applied (new enum values, new columns) **before** code that writes them.
2. `Settings` unchanged unless the release is a pricing change — and then recorded in the changelog.
3. Smoke test in staging: sell a device end-to-end (grade → offer → booking → inspect → handover), buy one (checkout → escrow → ship → settle), raise and resolve one return, retry one payout.
4. Dry-run the daily job on staging with `businessDate` set to tomorrow; confirm counts and no duplicate money.
5. Publish, then watch errors and the payout job for 24 h.

## 4. Hosting the reference build

- **App + server functions**: one deployable on Cloudflare Workers (Vite build, Node compat). No serverless cold-start tuning needed; keep the bundle small by not importing the ops console into the customer bundle.
- **Data, auth, storage, mail**: the managed backend that ships with the app. Record access rules live with the schema — deploying the schema deploys the rules.
- **Scheduler**: the platform's scheduled task, or any external cron hitting the function URL with the secret header.
- **Domains**: point the app's primary domain at the deployment, add the mail sender domain's DNS records (SPF, DKIM, DMARC). Keep the platform subdomain available for previews only.

## 5. Moving off the reference backend (no domain change)

1. **Schema**: create the 21 tables from `docs/database.md` in Postgres; enums as `text + CHECK`; objects as `jsonb`; add the indexes in § 11.
2. **Access rules**: translate `docs/roles.md` § 6 to RLS policies. Keep the "money tables are system-write-only" rule by granting writes only to the service role used by your endpoints.
3. **Domain modules**: port `pricing`, `offer`, `inspection`, `lifecycle`, `custody`, `returns` verbatim (they are framework-free). Keep `Settings` as the only source of numbers.
4. **Endpoints**: implement the 25 commands and the read models from `docs/api.md`. Keep the same paths, bodies and error shape so the frontend needs no change beyond the client base URL.
5. **Jobs**: move `runDailyJobs`, `recalcLiquidity`, `computeMetrics` to your scheduler; keep them idempotent and parameterised by business date.
6. **Auth**: map the current user record to your provider; preserve `app_role`, `active_mode`, `hub_id`, `trust_score`.
7. **Files**: swap uploads to presigned URLs; keep seller/inspection media private.
8. **Mail**: implement `notify()` as in `docs/notifications.md` § 6; point `APP_PUBLIC_URL` at the new host.
9. **Cutover**: run both systems read-only for a day, compare record counts and one pricing case, then switch writes. Keep the old store read-only for 30 days.

## 6. Data seeding

`seedDemoData` (ops/admin, demo environments only) creates: the catalogue with grade prices and tiers, hubs with slots, demo accounts for each role, devices in every custody state (refurbishment, listed at each ladder step, reserved, shipped, delivered, returned, liquidated), bookings for today, orders at each status, payouts (paid, due, failed), open exceptions of all four types, and eight weeks of liquidity history.

For a clean production start: seed only `Settings` (the documented defaults), `DeviceModel` for the catalogue you actually buy, and `Hub` records. Never seed demo users, orders or payouts in production.

## 7. Observability

| Signal | Where to look |
| --- | --- |
| Command errors | server logs with the endpoint name + status; alert on 5xx |
| Failed payouts | `Payout` where `status='failed'`; the exception queue; job alert on `payoutsFailed > 0` |
| Stuck returns | `ReturnRequest` open longer than 7 days (`awaiting_decision`) |
| Ageing stock | listings at `review` and devices in `refurbishment` too long |
| Mail failures | logged by `notify()`; never fatal, but watch the rate |
| Webhook failures | payment/courier webhook logs + retry queue |
| Business health | the nine metrics (O-10) and the ops overview |

Alert thresholds worth having from day one: any 5xx on a money command, any payout failure, daily job not run by 01:00 IST, any return open > 7 days, any order paid but not dispatched in 48 h.

## 8. Security hardening

- Rotate every server secret on a schedule; keep them out of the client bundle and out of logs.
- Verify webhook signatures (payments, courier) with the provider's secret; reject unsigned calls.
- Enforce rate limits on auth and on the help form; `SUPPORT_EMAIL` is not a public relay.
- Never widen a read model to "make it work": add a field deliberately, per audience.
- Review the access-rule matrix whenever a new table or role appears.
- Store seller photos, signatures, phone numbers and addresses as private data with short-lived access; purge on account deletion.
- Confirm staff devices for MFA; ops accounts hold the widest access in the system.
- Log every money action with actor (`ActivityLog`) so an incident can be reconstructed.

## 9. Go-live checklist

```
[ ] Settings reviewed by the business (fees, days, caps, thresholds)
[ ] Price band, commission and fees match the published policy
[ ] Catalogue loaded with real grade prices; no placeholder-price models in the buy flow
[ ] Hubs loaded with correct slots and capacity; one technician assigned per hub
[ ] Ops and technician accounts created, MFA on, demo mode off
[ ] Payment capture + refund tested with a real (small) transaction and a refund
[ ] Payout rail tested with a real (small) transfer and a deliberate failure
[ ] Courier webhook tested; a delivered order starts the return window correctly
[ ] Transactional mail verified to inbox; every ✉ event fired once
[ ] Daily job scheduled; dry-run reviewed; alerting live
[ ] Backups + restore rehearsed
[ ] Support form reaches the care inbox; ops can see and resolve requests
[ ] Legal pages (terms, privacy, warranty policy) linked from checkout and the help page
[ ] Privacy: retention policy for photos/signatures; deletion path for an account
```

## 10. Rollback

- **Code**: redeploy the previous build; the schema is additive, so an older build keeps working.
- **Data**: restore the last snapshot only for corruption, never for a pricing mistake (a wrong fee is fixed by editing `Settings` and re-pricing affected open offers).
- **Money**: a wrong payout is corrected with a new compensating `Payout`/`EscrowTransaction` row and an `ActivityLog` note — never by deleting a ledger row.
- **Job**: if a run misbehaves, disable the schedule first, then reproduce in staging with an explicit `businessDate`.

## 11. Cost & capacity notes

| Area | Note |
| --- | --- |
| Compute | edge/serverless suits bursty traffic; a 1 vCPU container handles the same load for a small catalogue |
| Database | the daily job is the heaviest read; page it and index as in `docs/database.md` § 11 |
| Storage | photos dominate; compress on upload (≤ 1600 px), keep inspection media 12 months |
| Mail | only 14 events are emailed; a few thousand a month at small scale (simulated, ₹0, in the capstone) |
| AI (if enabled) | 8 images per submission is the cost unit; grade the whole catalogue band, not just flagships |
| Money | provider fees per capture/transfer; batch payouts once a day rather than per event where the rail allows |

## 12. Operating the demo

For sales demos and UAT: Ops → Demo.

- **Advance clock +7** → ladder step 1 lands, offer expiries fire, day-21 balances appear.
- **Advance +15 more** (day 22) → second ladder step approaches, balances paid.
- **Advance to day 45** → review alerts, liquidation candidates.
- **Payout failure switch** → the failed-transfer path, the exception, and `retryPayout`.
- **Reset demo data** → a clean, fully populated world in one click.

Everything the demo shows is the production code path with a shifted date — that is the point of keeping the offset in data.
