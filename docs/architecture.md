# CertiBuy — Rebuild Architecture

**Status:** Approved, capstone demo edition · **Date:** 14 November 2026 (revision 4: consistency review against the audit and topical docs)
**Sources of truth:** `CLAUDE.md`, all documents in `docs/`, and `docs/Audit report.txt`.

**Goal:** rebuild CertiBuy from its documentation, fully independent of Base44, as a **capstone demonstration project with a strict zero-budget requirement**. Every existing business rule and audited workflow is kept. The architecture is designed so the same codebase can later move to a paid production stack without rewriting business logic (§19).

---

## 0. Constraints and stack at a glance

| Concern | Decision |
|---|---|
| Frontend | Next.js (App Router) + React + TypeScript |
| Backend | **Next.js Route Handlers** (the App Router's API routes) under `/api/v1/*`. No separate server |
| Database | **Supabase Free**: managed PostgreSQL. Accessed through Prisma so the SQL stays portable |
| Authentication | **Supabase Auth**, with CertiBuy's own role model (`app_role`) stored in a `profiles` table |
| File storage | **Supabase Storage**: private bucket for seller/inspection photos and signatures, public bucket for catalogue images |
| Business logic | Independent TypeScript packages in this repository. **No Supabase or Next.js imports** in domain or application code |
| Hosting | **Vercel Hobby**, for eligible personal, non-commercial demonstrations |
| Scheduled jobs | **Triggered manually** from the Operations console (new Ops → Jobs page). Safe to run late, and a late run catches up |
| Payments, payouts, courier, AI grading | **Simulated**, behind adapters that a real provider can replace later |
| Email | **Simulated** (stored and viewable in an ops mail log). In-app notifications are real |
| Budget | **₹0.** No AWS, no paid APIs, no paid hosting, no paid external services |
| Base44 | **No dependency** of any kind: no SDK, no code, no runtime calls |

---

## 1. Decisions recorded

### 1.1 Product decisions (answers to the audit's open items)

| # | Topic | Decision | What it means in the rebuild |
|---|---|---|---|
| 1 | Source code | Build from the documents. Code must be independent of Base44 | No Base44 export or translation. Engines are written from `docs/`, and golden test cases come from the documented formulas and worked examples (§15) |
| 2 | Existing data | Base44 holds seed data plus 2 real records. Retrieve the latest data if possible; otherwise not required | One-off, best-effort export of the 2 real records (§17). Demo data is re-created by our own seed. Nothing at runtime depends on Base44 |
| 3 | F7: buyer cancellation | **Added.** A buyer may cancel before dispatch and a **full refund** is started | New `cancelOrder` command (§11.2). `cancel_fee` defaults to 0, which means a full refund |
| 4 | F9: grade D | Grade D goes to refurbishment, is refurbished, and is **listed with no warranty** | Handover still sends D to `in_refurbishment` with no listing. Ops → "Mark refurbished and list" creates the listing with `warranty_months = 0` and no warranty add-on (§10.2). The buyer grade-guide copy is now correct |
| 5 | F10: floor price | Floor price is the price **below which the ladder never sells**. After 45 days the device goes to **B2B** | One definition: `floor_price = device_model.b2b_floor_price`, copied onto every listing (first listing and relist). Day 45 → review → B2B liquidation at the floor (§10.3) |
| 6 | F11 / F12 / F15 / F16 | Build all four | Support inbox, staff invitations, audit viewer, and incrementing the user's `return_count` are all in scope (§5, §8, §11) |
| 7 | New Settings fields | `checkout_hold_minutes` and `cancel_fee` approved, with defaults signed off by the business | Confirmed defaults: `checkout_hold_minutes = 15`, `cancel_fee = 0` |

Audit findings deliberately left unchanged: **F8** (no seller-side cancellation fee; the only seller penalty is still the mismatch fee), **F13** (the nine implemented metrics are the metric set), **F17** (liquidity demand stays a documented proxy).

### 1.2 Documentation inconsistencies and how the rebuild resolves them

| # | Inconsistency | Rebuild resolution |
|---|---|---|
| D1 | The mismatch flow says "collect the inspection fee (₹100)", but Settings has a separate `inspection_fee` (200) and `mismatch_fee` (100) | Use `mismatch_fee` for the mismatch flow (matches the audit) |
| D2 | One doc says the ladder never goes below the B2B floor, but the build uses acquisition cost for a first listing | **Resolved by decision 5:** the floor is always the model's B2B floor |
| D3 | One doc says the return window is "fixed at payment time" while also saying it starts at delivery | Starts at **delivery** (`delivered_at + return_window_days`), as `api.md` and `automations.md` say. *Confirmed* |
| D4 | One doc says a `due` balance payout "exists from handover", but `completeHandover` only creates the first payout | Create the `due` balance row at handover for Sell For More deals so the seller sees the promise. The daily job promotes it on day 21. *Confirmed* |
| D5 | `api.md` lists about 15 actions that change data under "read models" | Treated as commands (`POST`) |
| D6 | `CLAUDE.md` links to `docs/audit.md`, but the file is `docs/Audit report.txt`, and docs end in `.md` | Resolved: links updated to `.md` filenames (see §20, item 7) |

---

## 2. System architecture

```
                       Browser (phone / tablet / desktop)
                                   │ HTTPS · Supabase session cookie
┌──────────────────────────────────▼───────────────────────────────────────┐
│  Vercel Hobby — one Next.js app                                           │
│                                                                           │
│  UI (App Router): Seller · Buyer · Hub · Ops   (route guards = UX only)   │
│                                                                           │
│  Route Handlers  /api/v1/views/:name     GET   read models                │
│  (thin HTTP)     /api/v1/commands/:name  POST  the only way money/status  │
│                                                changes (incl. jobs)       │
│        │  session → actor → validate → call application                   │
│        ▼                                                                  │
│  packages/application  commands · read models · jobs · policies · notify  │
│        │                       │                          │               │
│  packages/domain         packages/db (Prisma)     packages/integrations   │
│  PURE rules: pricing,    portable SQL, no         ports + SIMULATED       │
│  grading, offer,         Supabase calls           adapters: payments,     │
│  inspection, lifecycle,                           payouts, courier,       │
│  custody, returns,                                grading, mail, IMEI     │
│  liquidity, business                              + supabase/ adapters    │
│  date                                             (auth, storage)         │
└────────────┬──────────────────────────────────────────────┬──────────────┘
             │ Postgres (pooled connection)                  │ Supabase APIs
   ┌─────────▼──────────────────────────────────────────────▼──────────┐
   │  Supabase Free                                                     │
   │  PostgreSQL (21 domain tables + infra tables) · Auth · Storage     │
   └────────────────────────────────────────────────────────────────────┘
```

**The rule that keeps the system portable:**
- Supabase is used for exactly three things: **a Postgres database, user sign-in, and file storage**.
- The browser never queries database tables directly. All data goes through our API routes.
- Only two places in the code know Supabase exists: `packages/integrations/supabase/` (auth session and storage) and `packages/db/supabase/` (Supabase-only SQL).
- A lint rule forbids importing `@supabase/*` anywhere in `domain/` or `application/`.

### 2.1 Key technology choices, explained

| Choice | What it is, in plain terms | Why we chose it |
|---|---|---|
| **Next.js Route Handlers** | Files like `app/api/v1/commands/[name]/route.ts` that run on the server when called | One deployable, free on Vercel. Handlers stay thin: they only translate HTTP into a call to `packages/application`, so moving to a separate Node server later is a copy job, not a rewrite |
| **Why not Server Actions for commands** | Next.js's built-in "call a server function from a form" feature | An explicit `POST /api/v1/commands/<name>` contract mirrors `api.md`, can be tested with plain HTTP, and moves to any backend unchanged |
| **Supabase Free** | A hosted Postgres database with sign-in and file storage included | Zero cost, real PostgreSQL (not a proprietary store), and auth plus storage without extra services |
| **Prisma (instead of the Supabase JS client) for data** | A typed TypeScript layer over Postgres | Money commands need **database transactions and row locks**, which the Supabase JS client can't do. Prisma also keeps schema and migrations as portable SQL |
| **Supabase Auth** | Sign-up, sign-in, password reset, email OTP, TOTP MFA and Google sign-in, managed for us | Free and secure, so we don't build auth ourselves. We still own the role model in our own table |
| **Zod contracts** | Schemas that describe and check the shape of data | Command inputs and read-model outputs are defined once. A buyer read model *cannot* include `floor_price`, because unknown fields are dropped |
| **Ports and adapters** | Each external effect sits behind an interface with a simulated version now and a real version later | Payments, payouts, courier, AI grading and email stay simulated for the capstone. Going live means adding an adapter, not touching business rules |
| **pnpm workspace (monorepo)** | One repository with an app and several small packages | Business logic lives in packages that physically can't import Next.js or Supabase |

---

## 3. Zero-budget guardrails

### 3.1 Free-tier limits to design around

These are approximate as of writing. **Check the current Vercel Hobby and Supabase Free plan pages before the demo.**

| Limit | Impact | Mitigation |
|---|---|---|
| Vercel Hobby is for **personal, non-commercial** use | Fine for a capstone. Not allowed for real trading | Moving to production requires a paid or commercial plan (§19) |
| Serverless functions have a **maximum run time** per request | A large daily-job run could time out | Jobs process **in batches** and return a cursor. The Ops page loops until done (§13). The demo dataset is small |
| Vercel Hobby cron jobs are limited (roughly once a day) | No precise 00:30 IST schedule | Jobs are **manual** from Ops → Jobs. One optional daily cron can call a health check |
| Supabase Free projects **pause after about a week of inactivity** | The demo could be asleep on presentation day | Resume from the Supabase dashboard before a demo. The optional daily health-check cron also keeps it active |
| Supabase Free database (~500 MB) and storage (~1 GB) | Photos dominate storage | Compress images in the browser to ≤ 1600 px (~200–300 KB). Cap inspection photos at 10. "Reset demo data" also purges demo files |
| Supabase's built-in email is **rate-limited and intended for testing** | Auth emails (confirm, reset) may not reach arbitrary addresses | Demo accounts are seeded pre-confirmed. Staff invites show a copyable link (§8.4). Notification email is simulated (§12) |
| Supabase Free allows a limited number of active projects (2 as of writing) | Only room for dev and demo | `certibuy-dev` and `certibuy-demo`. Local development runs the free Supabase CLI stack in Docker |
| Vercel Hobby is a single-person account, and (as of writing) deploying a private repository owned by a GitHub *organisation* needs a paid team plan | A capstone team can't all share one Hobby project | Keep the repository under the deploying student's personal GitHub account (or make it public). Teammates contribute through GitHub pull requests; only the owner manages the Vercel project. Verify before Phase 0 |

### 3.2 Rules that keep the cost at zero

- No AWS, no paid APIs, no paid SaaS, no paid domains. The `*.vercel.app` domain is used.
- No AI provider calls. Grading is the deterministic engine.
- GitHub (repository + Actions free minutes) is the only other service.
- Anything that would cost money is documented as a production step in §19, never added "just in case".

---

## 4. Folder structure

```
certibuy/
├─ apps/
│  └─ web/                              the only deployable (Vercel)
│     └─ src/
│        ├─ app/
│        │  ├─ (auth)/                  login, register, forgot-password, reset-password, mfa
│        │  ├─ auth/callback/route.ts   Supabase sign-in / invite / reset redirect target
│        │  ├─ (app)/                   signed-in shell: session gate + AppShell
│        │  │  ├─ page.tsx              role router (homeFor)
│        │  │  ├─ seller/               S-01…S-14 (wizard under sell/[submissionId]/…)
│        │  │  ├─ shop/                 B-01…B-11 (+ cancel order, F7)
│        │  │  ├─ hub/                  T-01…T-08
│        │  │  ├─ ops/                  O-01…O-11 + jobs, support (F11), audit (F15), mail-log
│        │  │  └─ profile, notifications, help
│        │  └─ api/v1/
│        │     ├─ commands/[name]/route.ts   POST → application.commands[name]
│        │     └─ views/[name]/route.ts      GET  → application.views[name]
│        ├─ middleware.ts               refresh Supabase session; coarse signed-in redirect
│        ├─ server/                     HTTP glue only: getActor(), error mapping, rate limit
│        ├─ components/                 ui/, common/, layout/, seller/, shop/, hub/, ops/ …
│        ├─ hooks/                      TanStack Query hooks per area
│        └─ lib/                        api client, formatters (en-IN, Asia/Kolkata), photo check
├─ packages/
│  ├─ domain/                           PURE TypeScript: no DB, no HTTP, no clock, no Supabase
│  │  └─ pricing · offer · grading · inspection · lifecycle · custody · returns · liquidity
│  │     · business-date · money · __fixtures__/ (golden cases from the docs)
│  ├─ application/                      use-cases (transactions, policies, projections)
│  │  ├─ commands/<area>/<name>.ts      names = api.md (+ cancelOrder, support, invites)
│  │  ├─ views/<area>/<name>.ts
│  │  ├─ jobs/                          runDailyJobs, recalcLiquidity, computeMetrics,
│  │  │                                 processOutbox, expireCheckoutHolds, seedDemoData
│  │  ├─ policies/                      canOpenArea, assertOwner, assertHubAccess, assertStaff
│  │  └─ notify/                        the single notify() fan-out + outbox
│  ├─ contracts/                        zod schemas for every command/view, enums, statuses (label + tone)
│  ├─ db/
│  │  ├─ prisma/schema.prisma           portable schema
│  │  ├─ prisma/migrations/             portable SQL: tables, indexes, partial uniques, triggers, RLS
│  │  ├─ supabase/                      Supabase-ONLY SQL: auth.users link, current_user_id() shim,
│  │  │                                 storage buckets + policies, new-user trigger
│  │  └─ seed/                          settings, catalogue, hubs, demo world, optional Base44 import
│  └─ integrations/
│     ├─ payments/  payouts/  courier/  grading/  imei/  mail/   {port.ts, simulated.ts}
│     └─ supabase/                      auth (session → user id), storage (signed upload/download)
├─ supabase/config.toml                 local Supabase CLI stack (free, Docker)
├─ e2e/                                 Playwright: money paths
└─ docs/                                existing docs + architecture.md + adr/
```

The most important split is still `domain/` (pure rules) versus `application/` (use-cases). A user command, an Ops → Jobs button press and the demo clock all call the *same* application function, so "what you demo is what runs".

---

## 5. Frontend: the four user experiences

**Shared foundations** carried over from the current app:
- design tokens (HSL values from `frontend.md` §5), Onest / Instrument Serif fonts
- shadcn/ui, `StatusChip` / `GradeChip`, one `statuses.ts` in `packages/contracts`
- light and dark themes
- loading, empty and error states on every screen
- layouts tested at 390 px and 1440 px

A permanent **"Demo — no real money moves"** banner is shown in the app shell, because every money integration is simulated.

**Data flow:** screen → TanStack Query hook → `GET /api/v1/views/x` → command `POST` → refetch the affected queries.
- No optimistic updates for money or status.
- Personal-data pages are rendered dynamically with `Cache-Control: private, no-store`.
- Middleware only checks that the visitor is signed in. Each area's `layout.tsx` checks the role from the profile on the server. The API re-checks everything.

| Experience | Routes | Device focus | Notable design points |
|---|---|---|---|
| **Seller** (customer, seller view) | `/seller`, `/seller/sell/[id]/{details,photos,diagnostics,result,offer,confirm,hub}`, `/seller/deals/[id]`, `/seller/payouts` | Phone-first | Wizard state lives on the `Submission` record. Photos are checked and compressed in the browser, then uploaded straight to Supabase Storage with a signed upload URL. The **server checks the photo count** before grading (fixes F5) |
| **Buyer** (customer, buyer view) | `/shop`, `/shop/browse`, `/shop/grades`, `/shop/[listingId]`, `/shop/checkout/[id]`, `/shop/confirmation/[id]`, `/shop/orders[/id[/return]]` | Phone-first | Simulated checkout keeps the "simulate a declined payment" switch. **"Cancel order"** appears on the order page while the order is `pending` or `paid` (before dispatch), with the refund amount shown before confirming (F7) |
| **Technician** (hub) | `/hub`, `/hub/[jobId]/{identity,checklist,grade,decision,handover}`, `/hub/returns/[id]` | Tablet at the counter | Each step is enabled only when `getHubJob` returns `nextAllowedStep`. Signature pad uploads to the private bucket |
| **Ops** (console) | `/ops` + alerts, catalogue, pricing, liquidity, inventory, exceptions, hubs, users, metrics, demo, plus **new:** `jobs`, `support` (F11), `audit` (F15), `mail-log` | Desktop | Sidebar, tables that open a drawer per row, confirmation dialogs for destructive actions. Users page gains **Invite staff** (F12). Inventory gains the grade-D **refurbish and list (no warranty)** path (F9) |

Platform admin remains a capability on top of ops (`is_platform_admin`): user management, role assignment and opening any area. Role preview is also available to ops while demo mode is on (`roles.md` §4).

**The four personas map onto three roles plus the admin flag** (audit §3, F6): Seller and Buyer are one `customer` account seen from two sides; Inspection Technician is `technician` (hub-scoped); Operations Admin is `ops`, with `is_platform_admin` for staff management.

The customer is **one account with two sides**. `active_mode` only chooses the default side. Guards check `app_role` only.

---

## 6. Backend: API routes and services

**Contract** (kept from `api.md`, with the same names):
- `POST /api/v1/commands/<name>`: the 25 documented commands, about 15 ops actions (D5), plus `cancelOrder`, `inviteStaff`, `acceptInvite`, `replySupportRequest`, `resolveSupportRequest`, and the job commands. This is the **only** way money or status changes.
- `GET /api/v1/views/<name>`: one per screen. Each output schema projects only what that audience may see.
- Errors use the existing shape: `{ "error": "<sentence the UI can show>" }`, with status codes 400/401/403/404/409/422/500.

**What every command does, in order** (one shared wrapper enforces this):

1. `getActor()` gets the signed-in user ID from Supabase Auth (verified on the server), then **re-reads the `profiles` row** through Prisma. A role cached in the browser or the token is never trusted.
2. Validate input with zod.
3. Run the policy check: role, ownership, hub scope, and for staff, MFA level (§8).
4. Open a Prisma transaction and lock the rows involved.
5. Re-read `Settings` and the related records, then call the pure domain function.
6. Write the status change, ledger row, `ActivityLog` entry and notification/outbox rows **in the same transaction**.
7. Commit, then return.

An optional `Idempotency-Key` header makes retries safe, on top of the business-level checks.

**Service modules** (folders in `packages/application`):

| Module | Commands / jobs |
|---|---|
| Selling | gradeSubmission, computeOffer, icEligibility, acceptOffer, bookInspection, manageBooking, acceptRevised, declineRevised |
| Inspection | verifyIdentity, confirmGrade, reviseOffer, rejectForMismatch, rejectDevice, returnInspection |
| Custody & inventory | completeHandover, setListingOverride, markRefurbishedAndList (grade D → no warranty), liquidateDevice |
| Buying | placeOrder, **cancelOrder** (F7), advanceShipment |
| Returns | raiseReturn (+ user `return_count`, F16), resolveReturn |
| Payouts | attemptPayout (inside the daily job), retryPayout, collectMismatchFee |
| Catalogue & pricing | DeviceModel CRUD, savePricingSettings (with history), setIcPaused |
| Ops | exceptions, upholdGrade, hubs, users, **inviteStaff** (F12), metrics, **support inbox** (F11), **audit viewer** (F15), mail log |
| Jobs | runDailyJobs, recalcLiquidity, computeMetrics, processOutbox, expireCheckoutHolds, advanceDemoClock, seedDemoData |
| Notifications | notify(), mark read, unread count |

**Database connection on serverless:**
- At runtime, Prisma uses Supabase's **pooled connection** (transaction mode). Migrations use the direct connection.
- Because of the transaction-mode pooler, all locks are **transaction-scoped** (`pg_advisory_xact_lock`, `SELECT … FOR UPDATE`). Session-level locks are never used.
- The runtime connection string is configured for the pooler (Prisma's `pgbouncer=true` setting, which turns off prepared statements). Without it, queries fail intermittently on serverless.

**Concurrency safeguards** (enforced by the database, not only by code):

| Risk | Safeguard |
|---|---|
| Two buyers pay for the same listing | Conditional update `SET status='reserved' WHERE id=$1 AND status='active'`. Zero rows updated means 409 |
| Buyer cancels while ops dispatches | Both lock the order row. Cancel requires `status ∈ {pending, paid}` *after* the lock |
| Hub slot overbooked | Transaction advisory lock on (hub, date) in `bookInspection` |
| Instant Cash caps exceeded by simultaneous accepts | Transaction advisory lock around the exposure check in `acceptOffer` |
| Two balance payouts for one device | Partial unique index `payouts(device_id) WHERE type='balance'` |
| Escrow released or refunded twice | Partial unique indexes on `escrow_transactions(order_id)` for `release` and for refund types |
| Handover run twice | Unique index on `devices(submission_id)` |
| Two open returns on one order | Partial unique index `return_requests(order_id) WHERE status <> 'resolved'` |
| Job double-clicked | `job_runs(job, business_date)` row + advisory lock. Steps are idempotent |
| Reminder sent every run | Unique `notifications.dedupe_key` = (user, event, link), set **only** for deduplicated reminders (`offer_expiring`, `return_window_closing`). It is null for repeatable events such as `payout_paid`, which can legitimately recur with the same link |

---

## 7. Database schema

**Portability rules:**
- **Standard PostgreSQL only** in `prisma/migrations/`. No Supabase extensions are required by business tables.
- **One indirection for "who is calling":** RLS policies call `app.current_user_id()`. On Supabase it is defined (in `packages/db/supabase/`) as a wrapper around `auth.uid()`. On any other Postgres it is redefined to read a per-transaction setting. The policies themselves never change.
- `profiles.id` equals the auth user ID. The foreign key to `auth.users` lives in the Supabase-only SQL, so the portable schema doesn't depend on Supabase's `auth` schema.

**Conventions:**
- Text IDs (existing Base44 IDs kept if the 2 real records are imported).
- `snake_case` columns.
- Money stored as `integer` rupees.
- Business days stored as `text` (see deviation below), timestamps as `timestamptz`.
- Enums as Prisma enums.
- Objects (checklist, breakdown, factors, diagnostics) as `jsonb` with zod schemas.

**Deviation: business-date columns are `text`, not `date`.**
The original convention specified `date`. The implementation stores them as `text` (`yyyy-mm-dd` strings) for two reasons: (1) the domain layer is pure TypeScript with no DB dependency — it computes business dates as ISO strings via `business-date.ts`, and round-tripping through Prisma's `Date` serialisation adds timezone ambiguity that the string format avoids; (2) every comparison in the codebase is already a string comparison (`diffDays`, `addDays`, ladder logic) so a SQL `date` column would be cast to text on read anyway. The trade-off is that the database cannot enforce date validity or use native date arithmetic in raw SQL; the domain layer owns all date logic, and the `yyyy-mm-dd` format preserves sort order. If a future phase moves date logic into SQL (e.g. a materialised view for ageing), the columns should be migrated to `date` at that point.

**The 21 domain tables, as documented in `database.md`:**

```
Catalogue   settings (single row, id=1 CHECK) · device_models · liquidity_scores · hubs · blacklisted_imeis
Selling     submissions · offers · grade_assessments · bookings
Inspection  inspection_reports
Inventory   devices · listings
Buying      orders · escrow_transactions · return_requests
Money       payouts
Operations  exception_cases · activity_log · notifications · support_requests
People      profiles (app_role, active_mode, hub_id, trust_score, return_count, account_flagged,
            phone, city, avatar_key, payout_account, delivery_address, is_platform_admin)
```

**Relationships are unchanged from `database.md` §10.**

**Changes to existing tables, from the decisions above:**

| Table | Change | Source |
|---|---|---|
| `settings` | + `checkout_hold_minutes` (default 15), + `cancel_fee` (default 0), both business-approved | Decision 7 |
| `orders` | `cancelled` is now written. + `cancelled_at`, `cancel_reason`, `hold_expires_at` | F7 |
| `escrow_transactions` | `refund_full` / `refund_partial` also used for cancellations (`note` says "cancelled before dispatch") | F7 |
| `listings` | `floor_price` always = `device_model.b2b_floor_price` at creation. `warranty_months = 0` for grade-D listings | F9, F10 |
| `device_models` | `b2b_floor_price` becomes **required** for every active model | F10 |
| `support_requests` | + `reply`, `replied_by`, `replied_at`, `resolved_by`, `resolved_at` | F11 |
| `profiles.return_count` | Incremented by `raiseReturn` | F16 |

**New infrastructure tables.** These add no business rules:

| Table | Purpose |
|---|---|
| `payout_attempts` | Append-only, one row per (simulated) transfer attempt with a simulated reference |
| `payment_intents` | Simulated payment reference per order. Ready for a real provider later |
| `shipments` | Shipment record per order (manual courier now: who advanced it and when) |
| `outbox` | Simulated emails: rendered subject and body, status. Shown in Ops → Mail log |
| `file_objects` | Storage key, owner, kind, size. Lets the server verify uploads (F5) |
| `settings_history` | Every pricing change with actor and time. Offers store `settings_version` |
| `job_runs` | Last run, business date, counts, cursor, status, per job |
| `invitations` | Email, role, hub, invited by, status, expiry (F12) |
| `idempotency_keys` | Replay-safe command responses |
| `rate_limits` | Postgres-based counters for the help form, grading and orders (no Redis) |

**Ledger protection in the database:**
- Triggers reject `UPDATE`/`DELETE` on `escrow_transactions`, `activity_log` and `payout_attempts`.
- `payouts` updates are limited to status, attempts, failure reason and `paid_at`.
- Mistakes are corrected only with compensating rows.

All indexes from `database.md` §11 are carried over, plus `orders(status, hold_expires_at)` and `support_requests(status, created_at)`.

**Row-level security** (RLS: the database filters rows per user):
- RLS is **enabled on every table**.
- Policies from `roles.md` §6 are written against `app.current_user_id()`.
- The public Data API is not used by the app. The browser never queries tables, so even a leaked public key can't read business data.
- The app's own queries run server-side through Prisma and are authorised in code (§8). Running them under RLS too is an optional hardening step (§19).

---

## 8. Authentication and role permissions

### 8.1 Supabase Auth setup

- **Enabled:** email + password, email confirmation, password reset, TOTP MFA, and optionally Google sign-in (free).
- **Sessions:** handled with `@supabase/ssr`. The session lives in httpOnly cookies, and middleware refreshes it. The server always verifies the user with Supabase (`getUser`), never by trusting cookie contents.
- **Keys:** the service-role key is a **server-only** Vercel environment variable. It is used only for admin actions (inviting staff, seeding) and is never sent to the browser.

### 8.2 Roles (unchanged from the audit)

| Field | Values | Who can write it |
|---|---|---|
| `app_role` (permission axis) | `customer` · `technician` · `ops` | Platform admin only |
| `active_mode` (view preference only) | `buyer` · `seller` | The user |
| `is_platform_admin` | Replaces Base44's platform `role=admin` | Platform admin only (seeded for the project team) |

As in `roles.md` §2 and §7, an ops user can reach the Users screen, but the server lets only a caller with `is_platform_admin` change `app_role`, `hub_id`, `trust_score`, `return_count` or `account_flagged`, or invite staff. Ops accounts that manage staff carry the flag.

- **Bootstrap:** a database trigger on new auth users creates `profiles` with `app_role = customer`, once (server-side, as X-02 requires).
- `effectiveRole`, `homeFor` and `canOpenArea` are ported exactly from `roles.md` §3.
- Admin-only fields: `app_role`, `hub_id`, `trust_score`, `return_count`, `account_flagged`.
- Role and admin flags are **read from `profiles` on every request**. They are deliberately not put into the auth token, so a role change applies immediately.

### 8.3 Enforcement layers (`roles.md` §5)

1. **Route guard:** UX only.
2. **Read-model projection:** output schema per audience.
3. **Command policy:** role, owner, hub, and **MFA for staff**. Ops, admin and technician commands require a two-factor session. This is controlled by the `REQUIRE_STAFF_MFA` environment flag (on by default), which is a security setting, not a business number. On the demo deployment, enrol a free authenticator app (TOTP) once for each seeded staff account so demos aren't blocked. The flag stays on.
4. **Scoped data access:** repository helpers always add `seller_id = me` or `hub_id = my_hub`. A lint rule bans unscoped Prisma queries in views.
5. **Database RLS:** the last line of defence for any direct access.

### 8.4 Staff invitations without paid email (F12)

1. Ops → Users → **Invite staff** (caller must have `is_platform_admin`): email, role, and hub (required for technicians). This writes an `invitations` row.
2. The server asks Supabase Auth admin to generate an **invite link**. The link is **shown in the console to copy**, so no email delivery is needed. The person opens it, sets a password, and enrols MFA.
3. On first sign-in, `acceptInvite` applies the invited role and hub to the profile and marks the invitation accepted. Links expire.
4. Removing staff: set the role back to `customer` and sign them out of all sessions.

---

## 9. Pricing, grading and payout engines

All engines live in `packages/domain` as **pure functions**. They take Settings and records as inputs, never touch the database or the clock, and are tested with golden tables. **Every rule below is preserved exactly as documented.**

### 9.1 Pricing engine (`pricing.ts`, `offer.ts`, `custody.ts`)

```
gradePrice(model, grade, settings)  = market_price_<grade> ?? market_price_a × grade_factor_<grade>
guaranteed   = round(market × (1 − commission_pct/100) − inspection_fee)
instantCash  = round(market × (1 − commission_pct/100) − inspection_fee − market × risk_pct/100)
risk_pct     = score ≥ threshold + near_band ? risk_small_pct : risk_large_pct
icEligibility gates, in order: paused → confidence Low → score < threshold (+launch_tighten_pts in window)
                               → inventory_cap → per_model_cap   (each with reasonLabel + seller copy)
payoutPlan   = instant_cash_full 100% | advance advance_pct% + balance (on sale or custody_at + balance_day)
orderTotal   = (override_price ?? current_price) + warranty add-on (never on grade D / 0-month listings)
cancelRefund = total − cancel_fee            (cancel_fee = 0 → full refund)
```

No number is hardcoded. Every function takes `settings` as an argument. If Settings is missing, the API returns `400 "Settings are missing."`.

### 9.2 Grading engine (`grading.ts` + `GradingProvider` port), simulated

- `DeterministicGrader` is the **only grader** in the capstone. It covers the 5 hard rejects in order, worst of battery/cosmetic/function, confidence (High/Medium/Low), band shapes and seller-readable factors (`ai-integration.md` §3–5).
- The `GradingProvider` interface (`assess() → {estimate, band, confidence, factors}`, never a price) is already in place, so a vision model can be added later (§19) without touching anything downstream.
- The technician's confirmed grade (1/2/3+ failed checks map to B/C/D, worst of three, verdict `inside` / `one_below` / `two_below`) remains the contractual grade.

### 9.3 Payout engine (`lifecycle.ts` + `PayoutRail` port), simulated

```
due ─(buyer pays, or day 21 reached)→ pending ─attempt→ approved → paid
                                   └─fail→ approved (retry) … attempts ≥ payout_max_attempts → failed
                                          → ExceptionCase(payment_hold) once + notify seller ✉ + ops
```

- `SimulatedPayoutRail` succeeds unless `Settings.simulate_payout_failure` is on, in which case it fails with "Account name mismatch". This matches the reference exactly.
- Both writes (`approved`, then `paid`) are kept, and each attempt writes a `payout_attempts` row.
- Payouts never exceed the guaranteed price (asserted in code and in tests).

### 9.4 Ladder and returns

- `ladderFor`: day 15 −`step1_pct`, day 30 −`step2_pct`, price = `max(floor_price, …)` rounded to ₹10.
- Reserved days don't count. An override stops the ladder.
- `raiseMath`, `resolutionMath` and `outcomesFor` are unchanged: ₹300 "as shipped" deduction, ₹500 change-of-mind deduction (a **return** deduction only), DOA replacement.

---

## 10. Inventory and liquidity management

### 10.1 State machines and exposure

- Device and Listing transitions follow `vendor-architecture.md` §3.2, as a transition table in `domain/lifecycle.ts`. Every status write goes through `transition(entity, from, to)`, so an illegal move fails.
- **Exposure** for the Instant Cash caps = sum of `acquisition_cost` of devices CertiBuy owns that are not sold or liquidated. It is computed in SQL inside the locked accept transaction.

### 10.2 Grade D: refurbish, then list with no warranty (F9)

```
completeHandover (grade D) → Device in_refurbishment, NO listing (unchanged)
Ops → Inventory → "Mark refurbished and list"
   → parts_replaced recorded
   → Listing: base_price = gradePrice(model, D), floor_price = b2b_floor_price,
              warranty_months = 0, warranty add-on not offered
   → Device listed, ladder starts at day 0
```

A healthy returned grade-D device is relisted directly by `resolveReturn` under the same listing rules (0-month warranty, B2B floor, day 0). A faulty one goes to refurbishment and then follows the path above. Either way the buyer sees the same kind of listing, and the grade guide's "D ships without warranty" statement is now accurate.

### 10.3 Floor price and day-45 B2B (F10)

- **One definition:** `floor_price = device_model.b2b_floor_price`, copied onto the listing when it is created, for both first listings and relists.
- The ladder **never prices below the floor**.
- On day `review_day` (45): listing → `review`, device → `day45_review`, ops alerted (unchanged).
- **The expected outcome is B2B liquidation at the floor.** The ops alert and inventory drawer make "Liquidate to B2B" the primary action. Ops can still reprice instead.
- Liquidation stays a **manual, logged ops decision**, as `automations.md` §10 requires. Making it automatic is a one-line policy change if the business wants it later.
- Side effect to note: some devices may be laddered below their acquisition cost (never below the floor). Metrics will show it.

### 10.4 Liquidity

The weekly formula from `automations.md` §4 (weights, cold start, day-45 penalty) is unchanged. It now runs from **Ops → Jobs → Recalculate liquidity**. A partial unique index keeps exactly one current score per model. Demand remains the documented proxy (F17).

### 10.5 Business date

`businessDate(settings, now)` = IST calendar date + `sim_day_offset`. It is the only source of "today", and the clock is passed in so tests can fix the date.

---

## 11. Buying, cancellation and returns

### 11.1 Checkout (simulated payment)

```
placeOrder (simulated adapter, default "instant" mode — reference behaviour)
   declined → writes nothing (unchanged)
   approved → Order paid + PaymentIntent(simulated) + EscrowTransaction(hold)
              + listing reserved + device reserved
              + S4M balance (created as `due` at handover) becomes payable + notifications
```

The simulated adapter also has an **"async" mode** (toggle in Ops → Demo) that demonstrates the hold a real gateway needs:
- The order is created as `pending` with `hold_expires_at = now + checkout_hold_minutes`, and the listing is reserved.
- The buyer confirms on a simulated payment page, and the order becomes `paid`.
- Expired holds are cancelled and the listing released by **commands only**: when someone places an order on that listing, when the late buyer tries to confirm, and in bulk via Ops → Jobs. Read models never write. A listing view simply treats an expired hold as available. No timer is needed.

### 11.2 Buyer cancellation before dispatch (F7, new)

`cancelOrder { orderId, reason? }`, buyer of the order (or ops):

| Order status | Effect |
|---|---|
| `pending` (async payment not completed) | Order `cancelled`. Listing back to `active`, device back to `listed`. No money moved, so no escrow row |
| `paid` (not yet dispatched) | `EscrowTransaction(refund_full)` for `total − cancel_fee` (with the default 0, the full total). If `cancel_fee > 0` it becomes `refund_partial`. Order `cancelled`, escrow `refunded_full` / `refunded_partial`. Listing back to `active` with `reserved_days` kept. Device back to `listed` |
| `dispatched` or later | `409 "This order has already been dispatched. You can raise a return after delivery."` |

Further rules:
- The refund is shown before the buyer confirms.
- The command is idempotent (`already: true` on repeat).
- It writes an `ActivityLog` entry and a notification.
- **A cancellation never reverses a seller payout.** The seller's deal is with CertiBuy, so a Sell For More balance (created as `due` at handover and made payable when the buyer paid) stands.
- New notification event **`order_cancelled`** (buyer, email simulated). Ops sees cancellations in the activity feed.
- The ₹500 change-of-mind deduction still applies only to **returns**.

### 11.3 Shipment (simulated courier)

`advanceShipment` stays the manual path (ops, or the buyer in demo mode): `paid → dispatched → in_transit → delivered`. Each step writes a `shipments` row. `delivered` starts the return window (D3).

### 11.4 Returns

These are unchanged (`raiseReturn` → re-inspection → `resolveReturn`), plus **`profiles.return_count += 1`** when a return is raised (F16), alongside the existing `device.return_count`.

### 11.5 Support inbox (F11, new)

- Ops → Support lists `SupportRequest`s by status and topic, with the customer and related deal or order.
- Ops can **reply** (stored on the request and sent to the customer as an in-app notification, `support_reply`) and **resolve**.
- The customer sees replies on `/help`.
- Care email to `SUPPORT_EMAIL` is simulated through the outbox.

### 11.6 Audit viewer (F15, new)

Ops → Audit is a filterable, paginated view of `ActivityLog` (actor, entity, date range, text search). It is read-only, and CSV export is generated in the browser.

---

## 12. Integrations: all simulated in the capstone

| Integration | Reference build (audited) | Capstone adapter | Status in the capstone | Production replacement (§19) |
|---|---|---|---|---|
| Payment capture | Simulated | `SimulatedPayments` (instant + async modes, decline switch) | **Simulated** | Razorpay (or similar) + signed webhooks |
| Escrow | Internal ledger | Internal ledger | Real ledger, no real money | Internal ledger over captured funds |
| Refunds (returns + cancellations) | Ledger only | Ledger only | **Simulated** | Gateway refund API |
| Payout rail | Simulated | `SimulatedPayoutRail` (`simulate_payout_failure`) | **Simulated** | RazorpayX / Cashfree + penny-drop verification |
| Courier | Manual states | `ManualCourier` | **Simulated** | Shiprocket (or similar) + webhooks |
| AI grading | Deterministic engine | `DeterministicGrader` | **Simulated** (deterministic) | Vision model behind `GradingProvider`, shadow mode first |
| Diagnostics | Seller-declared + animated scan | Same | **Simulated** | Native diagnostics app (future) |
| IMEI blacklist | Local table | Table lookup | **Simulated** (no registry) | Registry API, table kept as cache |
| Notification email | Real, limited | `SimulatedMail` → outbox → Ops → Mail log | **Simulated** (a change from the reference: real email would need a paid or verified sender) | Resend / SES + verified domain |
| Auth email (confirm, reset) | Platform | Supabase built-in email (rate-limited, testing grade) | Real but limited. Demo accounts pre-confirmed | Custom SMTP |
| File storage | Real | Supabase Storage | **Real** | Supabase Storage (paid) or S3 via the storage port |
| In-app notifications | Real | `notify()` | **Real** | Same |

**Simulation is always visible:**
- The app shell shows "Demo — no real money moves".
- `getWorkspaceContext` returns `integrations: {payments: "simulated", …}`.
- Simulated money screens carry a "Simulated" tag next to amounts that would normally move real money.

**Notifications:** `notify(rows)` writes `Notification` rows plus `outbox` rows for the email events, in the **same transaction** as the business change. `processOutbox` (Ops → Jobs, and also after each command commits) marks simulated emails as sent. A mail problem can never undo a deal. `EMAIL_EVENTS` grows from 13 to 14 with `order_cancelled`.

---

## 13. Jobs: manually triggered from Ops

**New Ops → Jobs page (O-12).** It is available to ops and admin whether or not demo mode is on, because manual triggering is how this deployment runs.

| Button | Command | Notes |
|---|---|---|
| Run daily job | `runDailyJobs { businessDate?, cursor? }` | The 7 steps from `automations.md` §3, unchanged. Processed in batches. The page loops on `cursor` until `done` and shows the documented `counts` response |
| Recalculate liquidity | `recalcLiquidity` | Weekly in the docs, on demand here |
| Compute metrics | `computeMetrics` | The 9 metrics × 8 weeks |
| Send outbox | `processOutbox` | Simulated email delivery |
| Expire checkout holds | `expireCheckoutHolds` | Also happens when an order is placed or confirmed on that listing |
| Advance clock +N | `advanceDemoClock` | Demo mode only (O-11), then runs the daily job |
| Reset demo data | `seedDemoData` | Demo mode only. Also clears demo files |

Each row shows the **last run** (business date, time, actor, counts) from `job_runs`, and a warning if the daily job hasn't run for today's business date.

**Why manual is safe:**
- Every step acts on "records whose dates have passed" and checks for existing records first. A run after several missed days **catches up correctly**: ladder steps are computed from `days_listed`, and due balances and expired offers are all picked up. It never pays twice.
- Time-critical checks are also enforced at the moment of action, as in the reference: offer expiry at accept, return window at raise, checkout hold when ordering or confirming.
- Until the daily job runs for a new business date, ladder prices and payout states shown on screen are from the last run. The Jobs page warning makes this visible.

An optional free Vercel cron (about once a day, authenticated with `CRON_SECRET`) can call a health endpoint to keep the Supabase project awake, and can optionally also run the daily job. It is **off by default**.

---

## 14. Security

- **Authorisation:** the five layers in §8.3, plus required access tests (§15).
- **Price tampering:** commands accept IDs and choices only. Input schemas have no amount fields.
- **Keys:** the Supabase public (anon) key is public by design. Because RLS is on everywhere and the app never uses the Data API, it can't read business data. The service-role key and database URL are server-only Vercel environment variables. Nothing sensitive uses the `NEXT_PUBLIC_` prefix.
- **Sessions and CSRF:** httpOnly SameSite cookies via `@supabase/ssr`, and an Origin check on every command POST.
- **MFA:** TOTP is required for staff commands (§8.3).
- **Rate limits (F18):** Supabase's built-in auth rate limits, plus Postgres-based `rate_limits` for the help form, grading and orders.
- **Storage:**
  - Private bucket for seller photos, inspection photos and signatures. Only the server issues signed URLs, valid for 5 minutes, after a policy check.
  - Uploads use signed upload URLs scoped to a path like `submissions/<id>/<key>`.
  - Storage policies deny direct listing.
- **Personal data:** phone and address are visible only to the owner and ops. "Reset demo data" purges demo files (F19). Real personal data is limited to the 2 imported records, if any. A self-service account-deletion path and a retention policy are production items (§19).
- **Audit:** every money and staff action writes `ActivityLog`, now viewable (F15). Ledgers are append-only, enforced in the database.
- **Demo safety:** `seedDemoData` and `advanceDemoClock` require `demo_mode = true` *and* the environment flag `DEMO_TOOLS_ENABLED=true`.

---

## 15. Testing

| Level | Tool (all free) | What it proves |
|---|---|---|
| Domain unit tests | Vitest + golden tables + fast-check | Pricing, offer, grading bands, ladder (with the B2B floor), payout machine, return and cancellation maths, and business date match **golden cases written from the docs** (e.g. the `api.md` example: guaranteed ₹47,000, Instant Cash ₹42,500). Invariants: payouts ≤ guaranteed price, sum of escrow movements = order total (refund included), valid band shapes |
| Contract tests | Vitest + **plain PostgreSQL in Docker** with the `current_user_id()` shim | Each command: validation, auth, happy path, a business conflict, idempotent retry. Running on plain Postgres **proves the schema is portable** |
| Access tests | Same | Seller A can't read seller B's data. A technician can't see another hub. **No buyer payload contains a seller ID, cost or floor** (automatic forbidden-field scan). Staff commands without MFA return 403 |
| Concurrency tests | Same | Two simultaneous `placeOrder` calls give one order. Cancel vs dispatch race gives one winner. A double-clicked job gives one money movement |
| End-to-end | Playwright against the local Supabase CLI stack | Sell → handover → listing. Buy → escrow → settle. **Buy → cancel → refund.** Return → refund. Payout failure → retry. Grade D → refurbish → list with no warranty. Day 45 → liquidate |
| Time travel | Script | Advance the clock 7/15/21/30/45 days and check the expected notifications and money movements |

CI is GitHub Actions (free minutes): lint, typecheck, unit, contract (Postgres service container) and E2E on every pull request.

---

## 16. Deployment (capstone)

| Piece | Setup |
|---|---|
| Web + API | One Vercel Hobby project linked to GitHub. `main` deploys to the demo URL, and pull requests get free preview URLs. Function region set near the database where the plan allows |
| Database / Auth / Storage | Supabase Free: `certibuy-demo` (main) and `certibuy-dev` (previews). Choose the region closest to India (Mumbai where available) |
| Local | `supabase start` (free CLI, Docker) for Postgres, Auth, Storage and a mail catcher. Plus `pnpm dev` |
| Migrations | `prisma migrate deploy` (portable SQL) and then the Supabase-only SQL, run from CI on merge to `main` |
| Secrets | Vercel environment variables: `DATABASE_URL` (pooled), `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `APP_PUBLIC_URL`, `SUPPORT_EMAIL`, `DEMO_TOOLS_ENABLED`, `REQUIRE_STAFF_MFA`, `CRON_SECRET` |
| Monitoring | Vercel function logs, `job_runs`, `ActivityLog`, the ops overview. No paid tools |
| Demo-day checklist | Resume the Supabase project if paused → reset demo data → run the daily job → sign in once per role → verify the banner says simulated |

---

## 17. Data from Base44 (best effort, one-off)

1. **Try to export** the 2 real records (and their users) from Base44's own data export, as JSON or CSV. This is a manual, one-time download. **No Base44 code, SDK or API is added to this repository.**
2. If the export works: an import script in `packages/db/seed/` loads the records **with their original IDs**, after validating them against the new schema. Any files are re-uploaded to Supabase Storage.
   - Base44 can't export passwords. Real users are re-created in Supabase Auth and given a set-password link (shown to ops, §8.4).
3. If the export isn't possible: **skip it.** The demo seed provides the whole dataset, which matches decision 2.
4. Demo data comes entirely from our own `seedDemoData`: catalogue, hubs, demo accounts per role, devices in every custody state, orders at every status (including a cancelled one), payouts, exceptions, and liquidity history.

---

## 18. Phased implementation roadmap (capstone)

Each phase ends with something that can be demonstrated and a clear exit test.

| Phase | Scope | Exit criteria |
|---|---|---|
| **0. Foundations** | ~~Doc housekeeping (D6)~~ and ~~Settings defaults sign-off~~ (both done). Remaining: verify free-tier and repository terms (§3.1), resolve open item 8 (§20), golden cases written from the docs, pnpm workspace, CI, Vercel + 2 Supabase Free projects, local Supabase CLI | Empty app deployed to Vercel. Golden cases committed |
| **1. Domain core** | `packages/domain`: pricing, offer, grading, inspection, lifecycle (B2B floor ladder), custody, returns, cancellation maths, liquidity, business date | All golden cases and property tests pass |
| **2. Data and identity** | Prisma schema + portable SQL (constraints, triggers, RLS via `current_user_id()`), Supabase-only SQL, seeds, Supabase Auth + profiles + bootstrap trigger, policies, MFA check, command/view wrappers, app shell + RoleGate + tokens + demo banner | Sign in as each role and land on the right home. Access tests pass on plain Postgres |
| **3. Seller journey** | S-01…S-13, Supabase Storage uploads with server photo check (F5), deterministic grading, offer, Instant Cash eligibility, booking | A seller reaches `scheduled` with a correct offer |
| **4. Hub journey** | T-01…T-07, handover → Device + Payout (+ due balance, D4) + Listing (floor = B2B). Grade D → refurbishment | A full counter visit works in every verdict branch |
| **5. Buyer journey, cancellation and returns** | B-01…B-11, simulated checkout (instant + async), **cancelOrder (F7)**, manual courier, returns + T-08 + resolveReturn, user `return_count` (F16) | Buy → settle, buy → cancel → full refund, and return → refund all pass E2E |
| **6. Jobs and notifications** | Ops → Jobs (batched daily job, liquidity, metrics, outbox, holds), demo clock, payout machine, `notify()` + outbox + mail log, bell | Time-travel script matches the expected counts. A catch-up run after skipped days pays nothing twice |
| **7. Ops console** | O-01…O-11 + grade-D refurbish-and-list (F9), day-45 liquidate-to-B2B (F10), support inbox (F11), invite staff (F12), audit viewer (F15), settings history | **Feature parity with Base44 plus the decided changes**, demo-ready |
| **8. Hardening and demo polish** | Rate limits, storage policies, accessibility pass, performance (pagination, route splitting), responsive checks, demo-day script, optional Base44 import of 2 records | Security checklist passes. Full demo rehearsed on the Vercel URL at ₹0 cost |

Phases 3–5 can overlap with two developers: one on seller and hub, one on buyer and returns. They meet at `completeHandover`.

---

## 19. Migration path to a production architecture

The capstone is built so going to production is a series of **swaps behind existing boundaries**. The domain and application packages don't change.

| Area | Capstone (₹0) | Production step | Why it's a swap, not a rewrite |
|---|---|---|---|
| Hosting terms | Vercel Hobby (non-commercial) | Vercel Pro, or containers (any cloud) | Real trading is commercial use, which Hobby doesn't allow |
| API | Next.js Route Handlers | Keep them, or move `packages/application` behind a separate Node service (e.g. Fastify) | Handlers are thin. The application layer has no Next.js imports |
| Background jobs | Manual Ops → Jobs (+ optional daily cron) | Scheduled runs: Vercel Pro cron, `pg_cron`, or a worker with a Postgres-backed queue (pg-boss) | Jobs are already idempotent commands with a `businessDate` parameter |
| Database | Supabase Free | Supabase Pro (backups, no pausing), or any managed Postgres in an India region | Portable SQL via Prisma. Only `current_user_id()` and the auth FK are redefined |
| Auth | Supabase Auth | Supabase Auth on a paid plan + custom SMTP, or a self-hosted library (e.g. Better Auth) | Roles live in our `profiles` table. Only `integrations/supabase/auth` changes. User IDs are kept |
| Storage | Supabase Storage | Supabase paid, or S3 / R2 | All storage goes through the storage port. Supabase Storage is also S3-compatible |
| Payments | Simulated | Razorpay (UPI, cards, net banking) + signed webhooks + `webhook_events` table. The async `pending → paid` path and `checkout_hold_minutes` are already built | Adapter swap. The order and escrow state machines are already production-shaped |
| Refunds | Ledger only | Gateway refund API inside `resolveReturn` / `cancelOrder` | Adapter call inside the existing commands |
| Payouts | Simulated | RazorpayX / Cashfree, penny-drop verification at profile save, UTR via webhook | `approved` / `paid` two-step and `payout_attempts` already match real rails |
| Courier | Manual | Shiprocket (or similar): AWB at dispatch, webhook to statuses, proof of delivery | `shipments` table and state machine already exist |
| AI grading | Deterministic | Vision model behind `GradingProvider`: shadow → assist → primary, 8 s timeout, deterministic fallback, never a price | Interface and validation rules already defined (`ai-integration.md` §6) |
| Email / SMS | Simulated outbox | Resend / SES with a verified domain (SPF/DKIM/DMARC). SMS/WhatsApp after DLT registration | Outbox worker swaps the mail adapter |
| IMEI | Local table | Registry lookup, table as cache, re-check at handover | Port already exists |
| Observability | Vercel logs + job_runs | Error tracking (e.g. Sentry), uptime checks, alerts from `deployment.md` §7 | Additive |
| Security hardening | App-level authorisation + RLS for direct access | Optionally run app queries under RLS (`SET LOCAL` per transaction), CAPTCHA, CSP, key rotation, backup/restore rehearsal | Policies already written against `current_user_id()` |
| Compliance | Demo data only | India data residency (DPDP Act 2023), retention policy, legal pages, **GST invoicing and credit notes** (needs a tax advisor), legal check on the term "escrow" | New `invoices` module. No change to the pricing engine |
| Production guards | Demo banner always on | App **refuses to start** in production if any money adapter is simulated, `demo_mode` is on, or `sim_day_offset ≠ 0`. Demo tools are physically disabled | Config check at startup |

**Suggested production order:** paid hosting + database → real email → payments → refunds → payouts → courier → scheduled jobs → observability → compliance → go-live checklist (`deployment.md` §9) → AI grading in shadow mode.

---

## 20. Confirmed interpretations and remaining actions

Confirmed by the project owner on 14 November 2026:

| # | Item | Status |
|---|---|---|
| 1 | Defaults: `checkout_hold_minutes = 15`, `cancel_fee = 0` (full refund on cancellation) | Confirmed |
| 2 | D3: the return window starts at delivery (`delivered_at + return_window_days`) | Confirmed |
| 3 | D4: the Sell For More `due` balance row is created at handover and promoted on day 21 | Confirmed |
| 4 | Day-45 B2B liquidation at the floor price is a one-click ops action, not automatic | Confirmed |
| 5 | A cancelled order never reverses a seller's balance payout | Confirmed |

Documentation alignment (Phase 0):

| # | Item | Status |
|---|---|---|
| 6 | Topical docs updated to match these decisions: `database`, `api`, `features`, `notifications`, `overview`, plus targeted updates to `roles`, `automations`, `vendor-architecture`, `frontend`, `tech-stack`, `deployment` and `CLAUDE.md`. `Audit report.txt` keeps its content (only its internal links were updated, item 7): it records the Base44 baseline | Done (14 November 2026) |
| 7 | D6: make the links in `CLAUDE.md` and across the docs resolve. Resolved by keeping the existing `.md` filenames and updating every internal link to match (the audit link now points to `docs/Audit report.txt`); all links verified | Resolved (14 November 2026) |

Open items from the consistency review (revision 4):

| # | Item | Status |
|---|---|---|
| 8 | **DOA replacement lifecycle.** The docs end the replacement path at order `replaced` + escrow `held_replacement`, with a replacement unit allocated. They don't say how the replacement unit ships, when its return window runs, or when the held escrow is released. Proposed: the replacement unit ships through the normal `dispatched → delivered` states on the same order, its own window starts at its delivery, and the daily job releases the held escrow when that window closes with no open return | Needs product confirmation before Phase 5 |
| 9 | **Follow-ups in other docs** (not changed in this review): `CLAUDE.md` §3, §5 and §6 still describe the reference repository (`src/routes`, `server/functions`, `npm`, `src/lib/statuses.js`) rather than the rebuild layout in §4; `api.md` says checkout holds also expire "on read" (now: by commands only, §11.1) and labels `inviteStaff` "ops/admin" (now: platform admin only, §8.2); `database.md` should note that `notifications.dedupe_key` is set only for reminders (§6) | Completed (14 November 2026) |
