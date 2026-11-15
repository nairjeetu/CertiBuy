 CertiBuy — Tech Stack

The reference build is a TypeScript-friendly React app rendered on the server, with server functions and a managed entity store behind it. Nothing in the domain depends on that choice: `docs/deployment.md` maps every piece to a conventional alternative.

> **Rebuild stack (decided):** Next.js App Router + React + TypeScript on **Vercel Hobby**; Next.js Route Handlers as the API; **Supabase Free** for PostgreSQL, Auth and Storage; Prisma for portable schema and data access; business logic in framework-free TypeScript packages; payments, payouts, courier, grading and email simulated; ₹0 budget. Full detail in `docs/architecture.md`. The table below describes the Base44 reference build; the conventions, data rules, testing and quality bar in §2–§8 still apply to the rebuild.

---

## 1. Layers

| Layer | Choice (reference) | Version | Why |
| --- | --- | --- | --- |
| UI runtime | React | 19.1 | the component model the team knows; concurrent rendering |
| Framework | TanStack Start / Router | 1.168 / 1.170 | file-based routes, SSR + server functions in one deployable, type-safe loaders |
| Build | Vite | 8.2 | fast dev server, ESM-native, small prod bundles |
| Styling | Tailwind CSS | 3.4 | token-driven utilities, no CSS drift; tokens in `src/index.css` |
| Components | shadcn/ui (Radix primitives) | latest | accessible primitives we own (copy-in, not a black box) |
| Icons | lucide-react | 0.475 | consistent 24 px set, tree-shaken |
| Server state | TanStack Query | 5.84 | caching, invalidation, loading/error states per query key |
| Forms | react-hook-form + zod | 7.54 / 4.4 | small forms, schema validation shared with the server |
| Charts | recharts | 2.15 | metrics, stock-age and sparklines |
| Dates | date-fns + Intl | 3.6 | explicit `Asia/Kolkata`, no moment-timezone drift |
| Toasts | sonner | 2.0 | one notification style |
| Drag & drop | @hello-pangea/dnd | 18 | ops queue reordering (optional surfaces) |
| PDF / export | jspdf + html2canvas | 4.2 / 1.4 | receipts and report exports |
| 3D / motion | three, framer-motion | 0.171 / 11.16 | product hero (optional), micro-transitions |
| Runtime | Cloudflare Workers (Node compat) | — | edge SSR, cheap idle, global latency |
| Backend | server functions + entity store with per-record access rules | — | no server to patch; auth, storage, mail and rules included |
| Auth | platform auth: email + OTP, reset, MFA (TOTP/SMS), Google/Microsoft/Apple/SSO | — | don't build auth |
| Mail | platform transactional mail + a verified sender domain | — | deliverability handled |
| Storage | object storage + private signed URLs | — | seller photos and signatures are personal data |

## 2. Repository conventions

- **ESM only.** No `require`, no `module.exports`.
- **Paths**: `@/…` alias to `src/…`. Never `../../` chains.
- **Routes**: one file per URL under `src/routes`; dot-notation nests (`shop.orders.$orderId.jsx`), a trailing `_` opts out of a parent layout (`$orderId_.return.jsx`).
- **Server code** lives in `src/lib/*-fns.js` (read models and form actions) and `*-server.js` (server-only helpers); domain logic in the backend `shared/` modules.
- **Components**: default export named after the file; `ui/` holds primitives (never domain logic); one area per folder.
- **Naming**: `snake_case` in the database, `camelCase` in JS, `kebab-case` in URLs, `SCREAMING_SNAKE` for constants.
- **Comments** tie code to the spec (`// T-04`) and explain *why*, not *what*.
- **No new dependency** without a reason: the stack is deliberately small. Ask what the last four lines of code would look like without it.

## 3. Commands

```bash
npm install          # install
npm run dev          # app + backend dev server (hot reload)
npm run build        # production build — must pass
npm run preview      # serve the built bundle
npm run lint         # eslint
npm run lint:fix
```

## 4. Configuration & secrets

| Name | Where | Purpose |
| --- | --- | --- |
| `APP_PUBLIC_URL` | env (server) | base URL used in emails and links; not hardcoded in the code |
| `SUPPORT_EMAIL` | domain config | customer-care inbox |
| payment provider keys | env (server only) | capture/refund |
| payout rail keys | env (server only) | transfers |
| courier keys / webhook secret | env (server only) | shipment states |
| `SCHEDULER_SECRET` | env (server only) | authenticates the cron call to the daily job |
| mail provider key | env (server, if not using the platform) | transactional mail |
| storage credentials | env (server, if not managed) | uploads + signing |

Never expose a key with a `VITE_`/`NEXT_PUBLIC_` prefix unless it is genuinely public.

## 5. Data & state rules

| Concern | Rule |
| --- | --- |
| Reads | one read model per screen; project server-side; paginate with `cursor`/`limit` |
| Writes | one command per action; never a client-side status change |
| Cache | TanStack Query keys per screen; invalidate after a command; 30 s staleness for settings |
| Counters | `count`/`aggregate` on the server, never `arr.filter().length` on a loaded page |
| Realtime | optional subscription for the caller's own notifications; polling otherwise |
| Business date | always `real date + sim_day_offset`, IST, `yyyy-mm-dd` |
| Money | integer rupees, `en-IN` formatting, no floats in storage |

## 6. Testing

| Level | What to cover |
| --- | --- |
| Unit (pure domain) | pricing, offer, inspection, ladder, payout machine, return maths, business date — golden tables, no mocks |
| Contract | each command: validation, auth, happy path, one business conflict, idempotency on retry |
| Access | a seller cannot read another seller's submission; a technician cannot read another hub's job; a buyer's payload has no seller/cost/floor |
| E2E (thin) | sell→handover→listing, buy→escrow→settle, return→refund, payout failure→retry |
| Manual demo | advance the clock 7/15/21/30/45 days and confirm the expected notifications and money movements |

Suggested runners: `vitest` for unit/contract, Playwright for the four E2E paths.

## 7. Performance

- Route-level code splitting; the hub and ops consoles are separate bundles.
- Lists paginate at 20–50 rows; dashboards use server aggregates.
- Images: responsive sizes, lazy loading below the fold, catalogue images through an optimising CDN.
- The daily job reads in pages of ≤ 1000 records; above ~5 k listings, batch by hub.
- Costs 30 s and is shared by the shell; never re-fetch settings per card.

## 8. Accessibility & quality bar

Visible focus everywhere (global `:focus-visible`), labelled controls, `aria-pressed` on toggles, no colour-only status, reduced-motion respected, 40 px minimum tap targets, and copy that names the next action. Every list has an empty state; every async surface has a loading and an error state.

## 9. Portability map

| Reference | Common alternative |
| --- | --- |
| TanStack Start | Next.js (App Router), Remix, SvelteKit |
| Server functions | Next route handlers, Express/NestJS, Lambda |
| Entity store + record rules | Postgres + RLS (schema in `docs/database.md`) |
| Managed auth | Auth.js/Better Auth/Clerk/Supabase Auth |
| Platform mail | Resend / SES / Postmark |
| Storage + signing | S3 / R2 + presigned URLs |
| Platform scheduler | pg_cron / BullMQ / EventBridge / Cloud Scheduler |
| Workers | Node on Fly/Render/Railway, containers, or Lambda |

The domain modules (`pricing`, `offer`, `inspection`, `lifecycle`, `custody`, `returns`) have no framework imports — port them as they are.