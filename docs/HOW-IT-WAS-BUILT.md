# CertiBuy — How the app was built

This document records how the application was actually produced: the method, the
sequence, and the exact configuration steps for the two hosted services it depends on.
`architecture.md` records *what* was built and why; this one records *how*.

---

## 1. Method: specification first, code second

The product was written down before any application code existed. The `docs/` set
(`overview.md`, `features.md`, `database.md`, `api.md`, `roles.md`, `frontend.md`,
`notifications.md`, `automations.md`) is not documentation written after the fact — it
is the specification the code was generated from, and it remains the source of truth.

`CLAUDE.md` at the repo root is the contract. It states the non-negotiable invariants —
every business number lives in the `Settings` record, money and status changes happen
only on the server, all "today" logic uses the business date, roles are enforced twice,
each audience sees only its own projection of a record. Any AI coding session begins by
reading that file, so the constraints travel with the task instead of living in
someone's head.

The practical loop was:

1. Decide the behaviour and write it into the relevant `docs/` file.
2. Describe the change to the coding agent, pointing at the module code (`S-04`, `T-03`)
   that ties the request back to `features.md`.
3. Review the diff against the invariants in `CLAUDE.md`.
4. Run `pnpm build`, walk the affected money path in the UI, then commit.

Tooling: **Claude Code** and **Cursor** for implementation, with the specification files
as shared context. Design and planning work was done in conversation; the repository
only ever received reviewed diffs.

**What this method is good at:** holding a large surface area consistent. Enum values,
status labels, projections and access rules stay in step because the rule that governs
them is written down once and referenced, not re-derived per screen.

**Where it needs a human:** anything involving money semantics. The agent will happily
write a plausible pricing rule. Whether day 21 should transfer ownership, or whether a
mismatch fee belongs in the payout ledger, are product decisions and were made by the
team.

---

## 2. Stack

| Layer | Choice | Why |
| --- | --- | --- |
| App | Next.js (App Router), single deployable | One build, server actions and API routes in the same place |
| Hosting | Vercel Hobby | Free, zero-config for Next.js, preview per branch |
| Database | Supabase Postgres (Free) | Managed Postgres with Auth attached |
| Auth | Supabase Auth, email + password | No separate identity service to run |
| ORM / migrations | Prisma | Typed client; migration history in the repo |
| Monorepo | pnpm workspaces | `apps/web` plus pure `packages/*` |

`packages/domain` holds pure business rules — no database, no HTTP, no clock. That
separation is what makes the pricing, grading and lifecycle logic testable and is why
the same `isValidImei` check runs in the browser and on the server.

---

## 3. Build sequence

1. **Specification** — product, money model, flows, feature catalogue.
2. **Schema** — `packages/db/prisma/schema.prisma`, then the first migration.
3. **Domain** — pricing, offers, grading, lifecycle, custody, returns, business date.
4. **Application** — commands (writes) and views (read models), one per screen.
5. **Contracts** — zod schemas and status labels shared by both sides.
6. **Web** — route handlers calling the application layer; components calling those.
7. **Seed** — demo accounts, hubs, catalogue, and a spread of devices at different ages.
8. **Deploy** — Supabase project, then Vercel, then migrations, then seed.

---

## 4. Supabase configuration

Done once per environment. Values below are placeholders.

### 4.1 Create the project

1. supabase.com → **New project**
2. Name it, set a strong **database password** — save it; it is part of the connection
   string and the dashboard will not show it again
3. Pick the region closest to your users (this build uses `ap-northeast-1`)

### 4.2 Collect the keys

**Project Settings → API**

| Value | Goes to |
| --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` / publishable key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` / secret key | `SUPABASE_SERVICE_ROLE_KEY` — server only, never shipped to the browser |

### 4.3 Collect the connection strings

**Project Settings → Database → Connection string → URI.** Two different strings are
needed, and using the wrong one is the most common setup failure:

| Variable | Which string | Port |
| --- | --- | --- |
| `DATABASE_URL` | Transaction pooler, with `?pgbouncer=true` | 6543 |
| `DIRECT_URL` | Session pooler (or direct connection) | 5432 |

`DIRECT_URL` is what `prisma migrate` uses. PgBouncer in transaction mode breaks the
advisory locks and prepared statements migrations rely on, which is why the two are
separate. The **direct connection** is IPv6-only; on an IPv4 network use the **session
pooler**, which is IPv4 and works identically for migrations.

### 4.4 Authentication

**Authentication → Providers →** enable **Email**. For a demo, turn *Confirm email*
off so seeded accounts can sign in immediately.

**Authentication → URL Configuration →** set **Site URL** to the deployed origin
(`https://<project>.vercel.app`) and add it under **Redirect URLs**. The app has a
callback route at `/auth/callback`; sign-in and password-reset links fail silently if
this is not set.

### 4.5 Apply the database objects

```bash
cd packages/db
DATABASE_URL="<transaction-pooler-url>" DIRECT_URL="<session-pooler-url>" pnpm db:deploy
```

Then run the SQL in `packages/db/supabase/` through **SQL Editor**, in this order:

1. `current_user_id.sql` — helper used by the policies
2. `bootstrap_profile.sql` — creates a `Profile` row for each new auth user
3. `rls_policies.sql` — row-level security

Row-level security is the second of the two enforcement layers. The route guard in the
UI is the first; neither is sufficient alone.

### 4.6 Seed

```bash
cd packages/db
NEXT_PUBLIC_SUPABASE_URL="https://<ref>.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
DATABASE_URL="<transaction-pooler-url>" DIRECT_URL="<session-pooler-url>" \
pnpm db:seed
```

This creates the demo auth users through the Supabase admin API, the hubs, the device
catalogue and a spread of inventory. It needs the service role key because it writes
past RLS.

---

## 5. Vercel configuration

### 5.1 First deploy

1. Vercel → **Add New → Project** → import the GitHub repository
2. **Framework Preset:** Next.js
3. **Root Directory:** the repository root (`.`), not `apps/web` — this is a pnpm
   workspace and the build runs from the top
4. Add the environment variables (§5.2) **before** the first build
5. Deploy

### 5.2 Setting environment variables

**Project → Settings → Environment Variables.** Five are required:

| Key | Scope |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (and Preview if previews need it) |
| `DATABASE_URL` | Production, Preview |
| `DIRECT_URL` | Production, Preview |

For each: enter the **Key**, paste the **Value**, tick the environments it applies to,
**Save**.

### 5.3 Updating a variable — the step people miss

Environment variables are read **at build time**, not at request time. Changing a value
in the dashboard does nothing to the running site until a new build happens.

1. **Settings → Environment Variables**
2. Find the variable → **Edit** → change the value → **Save**
3. Go to **Deployments**
4. On the most recent production deployment, open the **⋯** menu → **Redeploy**
5. Leave *Use existing Build Cache* **unticked** — `NEXT_PUBLIC_` values are inlined
   into the client bundle at build time, and a cached build will keep the old value
6. Wait for the deployment to go green, then verify

This matters most for the `NEXT_PUBLIC_` pair. A stale `NEXT_PUBLIC_SUPABASE_URL`
produces a site that loads but cannot sign anyone in, with no server-side error to find.

### 5.4 Rotating the database password

Resetting the password in Supabase invalidates `DATABASE_URL` and `DIRECT_URL`
immediately. The deployed site breaks until both are updated in Vercel **and**
redeployed. Treat it as a planned change, never a casual one.

---

## 6. The release loop

Schema change in the release? Then the order is fixed:

1. Apply the migration locally, `pnpm db:generate`, test the path in the UI
2. `pnpm build` — must exit clean
3. Apply the migration to **production** with `pnpm db:deploy` and the production URLs
4. Only then `git push` — the push triggers the Vercel build

Reversing 3 and 4 puts code live that writes a column or enum value the database does
not yet have. Adding a value is backward compatible, so production tolerates step 3
happening while the old code is still serving.

No migration in the release? Then it is just `pnpm build`, commit, push.

---

## 7. What is simulated

Payments, payouts, courier movements, the grading model and outbound email are
simulated adapters behind ports in `packages/integrations`. The money rules, the ledger,
the escrow states and the lifecycle are real and run on every transaction. Swapping a
simulated adapter for a live provider is an integration change, not a redesign — which
was the point of putting them behind ports.

The business clock is also under our control: `Settings.sim_day_offset` shifts "today",
which is how six weeks of price-ladder ageing can be demonstrated in a few seconds.
In production that offset must be `0`.
