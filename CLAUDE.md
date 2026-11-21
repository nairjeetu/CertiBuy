# CertiBuy — Project Guide (read this first)

CertiBuy is a **custody-first refurbished-device marketplace for India**. Sellers hand a device over at a hub and get paid; CertiBuy inspects, grades, refurbishes and resells it to buyers with a warranty. There is no peer-to-peer shipping, ever: every device passes through CertiBuy's hands and every rupee passes through CertiBuy's ledger.

This file is the entry point for anyone (human or agent) working on the codebase. Read it, then open the one document under `docs/` that matches the task.

---

## 1. The one-paragraph mental model

A seller answers questions about a device and gets an **offer** with two prices: **Instant Cash** (CertiBuy buys it outright, only if the model is liquid enough and caps allow) or **Sell For More** (a guaranteed price, 50 % up front, the rest when it sells or on day 21). They book a **hub slot**, a **technician** verifies identity and IMEI, inspects against a checklist, and confirms a grade. If the grade lands inside the quoted band the seller is paid at the counter; one grade below means a **revised offer**; two or more below is a **mismatch** and the device goes back with a mismatch fee. Every device CertiBuy owns is listed at its grade price, steps down a **price ladder** on day 15 and day 30, and is reviewed on day 45. Buyers pay into **escrow**, get a 7-day window to raise a **return**, and the money is released to CertiBuy when the window closes.

## 2. Non-negotiable invariants

These are the rules that break the product if violated. Treat them as hard constraints in any change.

1. **Every number comes from the `Settings` record.** Commission, fees, day counts, ladder percentages, caps, weights, thresholds, battery floors, message limits. No business number is hardcoded in UI or logic. The only fixed constants allowed are engine shape values (grade order `A<B<C<D`, cold-start liquidity scores, milliseconds per day).
2. **Money and status changes happen only on the server.** A price, a grade, a payout, an escrow movement, a return outcome — all written by a server function after re-reading the records. The browser never sends a price; it sends an id and the server derives the amount.
3. **All "today" logic uses the business date**: `real date + Settings.sim_day_offset`, evaluated in `Asia/Kolkata`, as a `yyyy-mm-dd` string. Never compare raw timestamps for ageing, laddering or windows.
4. **Roles are enforced twice**: in the UI (route guard) and in data access rules / server checks. A customer holds both marketplace sides — `active_mode` is a view preference, never a permission.
5. **The seller never sees internal numbers** (commission split, floor price, acquisition cost, buyer identity); the buyer never sees the seller, the cost or the floor. Server read models project the fields each audience may see.
6. **Statuses are enums with one source of label and tone** (`packages/contracts`, `statuses.ts`). Never print a raw enum to a user.
7. **Idempotency for anything a retry can hit**: payout retries, revisits of the revise-offer screen, repeated daily-job runs, reopening a resolved return. Each is guarded by an existing-record check.
8. **A notification is a record first, an email second.** Email is best-effort; a mail failure must never undo a deal.

## 3. Repository map

This is the layout of the independent rebuild (pnpm workspace; full detail in `docs/architecture.md` §4). It describes the code as built and deployed.

```
apps/
  web/                         the only deployable (Next.js App Router on Vercel Hobby)
    src/app/
      (auth)/                  login · register · forgot-password · reset-password · mfa
      auth/callback/           sign-in / password-reset / staff-invite link target
      (app)/                   signed-in shell (gate) → seller/, shop/, hub/, ops/, help, profile, notifications
      api/v1/commands/[name]/  POST — the only way money or status changes
      api/v1/views/[name]/     GET  — per-screen read models
    src/server/                HTTP glue only: session → actor, error mapping, rate limit
    src/components/            ui primitives (shadcn) + domain components grouped by area
    src/hooks/                 TanStack Query hooks per area
    src/lib/                   api client, en-IN / Asia/Kolkata formatters, browser photo check
packages/
  domain/                      PURE business rules: pricing · offer · grading · inspection · lifecycle
                               · custody · returns · liquidity · business-date · money (no DB, no HTTP, no clock)
  application/                 commands · read models (projections) · jobs · policies · notify()
  contracts/                   zod schemas for every command/view, enums, statuses (label + tone)
  db/                          Prisma schema + portable SQL migrations · supabase/ (Supabase-only SQL) · seed/
  integrations/                ports + simulated adapters (payments, payouts, courier, grading, imei, mail)
                               · supabase/ (auth session, storage)
supabase/config.toml           local Supabase CLI stack
e2e/                           Playwright money-path tests (directory scaffolded, tests not yet written)
docs/                          the documentation set (see map below)
```

Rules of the layout: `domain/` and `application/` never import Next.js or `@supabase/*`; only `packages/integrations/supabase/` and `packages/db/supabase/` know Supabase exists; route handlers stay thin and call `packages/application`. There is no Base44 code, SDK or runtime dependency anywhere.

## 4. Documentation map

| Document | Read it when you need… |
| --- | --- |
| `docs/DEMO-WALKTHROUGH.md` | demo accounts and the step-by-step script for the seller, hub, buyer, ops and lifecycle flows |
| `docs/architecture.md` | **the rebuild**: stack (Next.js · Vercel Hobby · Supabase Free), folder structure, decisions taken after the audit, roadmap, production migration path |
| `docs/overview.md` | the product, business model, money model, end-to-end flows |
| `docs/features.md` | the full feature catalogue with module codes (S-, B-, T-, O-) |
| `docs/roles.md` | who may do what, mode switching, guard + access-rule patterns |
| `docs/vendor-architecture.md` | system/module map, state machines, ledgers, integration seams |
| `docs/database.md` | every table, field, enum, relationship and access rule |
| `docs/frontend.md` | routes, layouts, components, design tokens, UX rules |
| `docs/api.md` | every endpoint: auth, input, output, errors, side effects |
| `docs/notifications.md` | event catalogue, email policy, bell behaviour |
| `docs/ai-integration.md` | the grading engine, its confidence model, and how to add an LLM |
| `docs/automations.md` | the daily job, demo clock, liquidity and metrics jobs |
| `docs/tech-stack.md` | versions, libraries, conventions, commands |
| `docs/deployment.md` | environments, secrets, go-live checklist, rollback, migrating off the reference stack |

## 5. Local workflow

```bash
pnpm install
supabase start     # local Postgres + Auth + Storage (free Supabase CLI, Docker)
pnpm dev           # Next.js app (UI + API routes)
pnpm build         # production build (must pass before finishing any task)
pnpm lint
pnpm test          # domain + contract tests
```

Verification rules for any change:

- `pnpm build` passes with no unresolved imports.
- The money path you touched was walked end-to-end in the UI (seller offer → handover → listing → checkout → payout/refund).
- Any new screen has loading, empty and error states, and works at 390 px and 1440 px.
- Any new enum value was added to `docs/database.md`, `packages/contracts` statuses (label + tone) and its access rule if it gates visibility.

## 6. Conventions

- **Files stay small.** A page composes components; a component under ~80 lines. Domain components live in `apps/web/src/components/<area>/`.
- **Reading data**: a page's loader (or a query hook) calls a **server read model** — never joins ten entity lists in the browser. The server projects exactly the fields the audience may see.
- **Writing data**: a form calls a **command endpoint** (`POST /api/v1/commands/<name>`), then invalidates the relevant queries. No client-side updates of money or status.
- **Naming**: entity fields `snake_case`; JS functions `camelCase`; routes `kebab-case`; module codes in comments (`// S-04`, `// T-03`) tie code to `docs/features.md`.
- **Money** is an integer number of rupees; format with the `en-IN` grouping helper (₹1,32,000, no paise). Never store paise.
- **Dates** stored as ISO strings (`yyyy-mm-dd` for business days, full ISO for timestamps). Times are rendered in `Asia/Kolkata`.
- **Language**: English (India), sentence case, no exclamation marks. User-facing error copy says what to do next.
- **Accessibility**: keyboard focus is always visible (defined globally in the app's global stylesheet); every interactive control has an accessible name; nothing is conveyed by colour alone (status = label + tone).

## 7. Common tasks

| Task | Where to start |
| --- | --- |
| Change a fee, day count or percentage | `Settings` record + `docs/overview.md` § money model. Never edit a component. |
| Add a device model | Ops → Catalogue (`DeviceModel`), then liquidity recalc |
| Add a status or enum value | table schema → `packages/contracts` statuses → every screen that filters on it → access rules |
| Add an event | `docs/notifications.md` catalogue → emitting endpoint → `EMAIL_EVENTS` if it must also be emailed |
| Change what a buyer sees about an order | the order read-model projection in `packages/application/views/`, not the component |
| Add a hub | Ops → Hubs (`Hub` record with slots and daily capacity) |
| Reproduce a week of ageing | Ops → Demo: business clock `+7` (runs the daily job) |
| Reset the demo | Ops → Demo: Reset demo data (`seedDemoData`) |

## 8. Traps that have bitten before

- Comparing `created_date` timestamps instead of business dates → devices age wrong by the simulation offset.
- Trusting a `price`, `amount` or `status` sent by the client. The server re-derives them from records.
- Adding a screen that lists a raw entity — it will leak seller ids, costs or floor prices.
- Making the ladder skip `reserved` listings; reserved days must not count.
- Emailing an unregistered/unverified address and treating the send as guaranteed.
- Forgetting that a customer is one person on both sides: gating a page on `active_mode` instead of `app_role` locks buyers out of their own orders.
