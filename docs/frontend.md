CertiBuy — Frontend

## 1. Route map

> **Rebuild note:** the URLs below are kept. The rebuild uses the Next.js App Router, so the reference build's TanStack file names (`_authed/…jsx`) become `app/(app)/…/page.tsx` folders; see `docs/architecture.md`–5.

File-based routing: one file per URL. Signed-in pages live under a pathless authenticated layout, so the URL never contains `/authed`.

| URL | File | Guard | Purpose |
| --- | --- | --- | --- |
| `/` | `_authed/index.jsx` | signed in | role router: technician → `/hub`, ops → `/ops`, customer → saved mode or mode chooser |
| `/login` `/register` `/forgot-password` `/reset-password` `/mfa` | `login.jsx` … | public | auth flows (client-rendered) |
| `/seller` | `_authed/seller/index.jsx` | customer, mode seller | sell landing + deals |
| `/seller/sell` | `_authed/seller/sell.index.jsx` | customer | model picker (S-02) |
| `/seller/sell/:submissionId` | `…sell.$submissionId.index.jsx` | customer | details step (S-03) |
| `…/photos` `…/diagnostics` `…/result` `…/offer` `…/confirm` `…/hub` | same folder | customer | wizard steps S-04 … S-12 |
| `/seller/sell/:submissionId/result` (post-inspection) | `…result.jsx` | customer | revised price decision (S-14) |
| `/seller/deals/:submissionId` | `_authed/seller/deals.$submissionId.jsx` | customer | deal tracker (S-11) |
| `/seller/payouts` | `_authed/seller/payouts.jsx` | customer | payout history (S-13) |
| `/shop` | `_authed/shop/index.jsx` | customer, mode buyer | shop home (B-01) |
| `/shop/browse` | `_authed/shop/browse.jsx` | customer | browse + filters (B-02) |
| `/shop/grades` | `_authed/shop/grades.jsx` | customer | grade guide (B-04) |
| `/shop/:listingId` | `_authed/shop.$listingId.jsx` | customer | listing detail (B-03) |
| `/shop/checkout/:listingId` | `_authed/shop.checkout.$listingId.jsx` | customer | checkout (B-05) |
| `/shop/confirmation/:orderId` | `_authed/shop.confirmation.$orderId.jsx` | customer | receipt (B-06) |
| `/shop/orders` | `_authed/shop/orders/index.jsx` | customer | my orders (B-08) |
| `/shop/orders/:orderId` | `_authed/shop/orders/$orderId.jsx` | customer | tracking (B-07) + cancel before dispatch (B-12) |
| `/shop/orders/:orderId/return` | `…$orderId_.return.jsx` | customer | raise return (B-09). The trailing `_` opts out of the parent so it renders full-width |
| `/hub` | `_authed/hub.jsx` | technician/ops | queue (T-01) |
| `/hub/:jobId` | `…hub_.$jobId.jsx` | technician/ops | job shell with step tabs |
| `/hub/:jobId` (identity) `/checklist` `/grade` `/decision` `/handover` | same folder | technician/ops | T-02 … T-06 |
| `/hub/returns/:returnId` | `…hub_.returns.$returnId.jsx` | technician/ops | return re-inspection (T-08) |
| `/ops` | `_authed/ops/index.jsx` | ops | overview (O-01) |
| `/ops/alerts` `/catalogue` `/pricing` `/liquidity` `/inventory` `/exceptions` `/hubs` `/users` `/metrics` `/demo` | `_authed/ops/*.jsx` | ops | O-02 … O-11 |
| `/ops/jobs` `/ops/support` `/ops/audit` `/ops/mail-log` | `app/(app)/ops/*/page.tsx` | ops | O-12 jobs, O-13 support inbox, O-14 audit log, O-15 mail log |
| `/auth/callback` | `app/auth/callback/route.ts` | public | target for sign-in, password-reset and staff-invite links |
| `/help` | `_authed/help.jsx` | customer | customer care (X-05): submit a request and read ops replies |
| `/profile` | `_authed/profile.jsx` | signed in | profile (X-06) |
| `/notifications` | `_authed/notifications.jsx` | signed in | notification list (X-04) |

Rules: every screen is its own URL (never tabs in `useState`); every route declares `head()` metadata; a page that renders personal data is client-rendered (`ssr: false`) so it never lands in a cacheable document; public pages stay server-rendered.

## 2. Layouts

| Layer | Renders |
| --- | --- |
| Root document | `<html>`, fonts, providers (theme, auth, query client), toaster |
| Auth layout | centered card, brand mark, no app chrome — used by all five auth pages |
| `AppShell` | sticky `SiteHeader` + content area; either wide (1440 px) with an optional sidebar, or narrow (760 px) for forms |
| `SiteHeader` | brand, optional mobile nav sheet, and controls: demo role switcher, business-date pill, theme toggle, notification bell, mode switch, help link, user menu |
| `DemoBanner` | capstone build: permanent "Demo — no real money moves" strip, shown while any money integration is simulated |
| `TabsNav` | horizontal section tabs under the header (seller, shop, hub, ops) |
| `OpsSidebar` | console navigation, collapsible on desktop, drawer on mobile |

The hub job and the seller wizard each render a **step rail** (progress dots + labels) above their step content.

## 3. Component inventory

`src/components/` is grouped by area, each file small and single-purpose:

```
ui/            shadcn primitives (button, card, input, select, dialog, sheet, tabs,
               table, drawer, badge, switch, checkbox, slider, progress, tooltip, …)
common/        EmptyPanel, StatTile, StatusChip, GradeChip, SectionPlaceholder,
               ModeChooser, NeedHelpLink, SignedPhoto
layout/        AppShell, SiteHeader, TabsNav, BrandMark, ModeSwitch, UserMenu,
               NotificationBell, HelpLink, BusinessDatePill, ThemeToggle,
               DemoRoleSwitcher, OpsSidebar
auth/          LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage,
               MfaPage, AuthLayout, parts, RoleGate, RoleBootstrap, AuthGate
seller/        SellProgress, DeviceThumb
  sell/        ModelPicker, ModelCard, PillGroup, DetailsStep, PhotosStep,
               PhotoShotCard, DiagnosticsStep, ScanningPanel, RejectPanel,
               ResultStep, GradeScale, OfferCard, OfferBreakdown, ChoiceTiles,
               LadderTable, PayoutTimeline, SplitBar, InstantCashUnavailable,
               HubBooking, ConfirmStep
  deals/       DealRow, DealStats, SellHero
    tracker/   TrackerHeader, MoneyCard, PaymentsTable, BookingCard,
               InstantCashBanner, DealTimeline
  payouts/     PayoutStats, PayoutsTable
shop/          ShopHero, TrustTiles, GradeStrip, ListingCard, ShopFilters,
               FiltersPanel, ProductGallery, FactsCard, InspectionReportCard,
               BuyCard, CheckoutDelivery, CheckoutPayment, CheckoutSummary,
               OrderReceipt
  orders/      OrderRow, OrderHeader, TrackingTimeline, ReturnBanner,
               RefundCard, OpenReturnCard, PrototypeShipment
  returns/     ReturnReasonTiles, ReturnPhotoPicker, RefundBreakdown, RefundRules
hub/           JobContext, IdentityStep, ChecklistStep, GradeStep, GradeScale,
               DecisionStep, HandoverStep, HandoverPayout, HandoverSuccess,
               SignaturePad
  queue/       DayStrip, HubCard, JobCard
  returns/     ReturnInspection
ops/           DemoResetCard
  overview/    KpiCards, NeedsAttention, ActivityFeed, HubsToday, StockAgeChart
  alerts/      AlertGroup
  catalogue/   CatalogueTable, ModelDrawer
  pricing/     SectionCard, Field, PricingPreview
  liquidity/   LiquidityRow, ScoreBar, Sparkline, CapMeter, RunRecalcButton
  inventory/   InventoryTable, InventoryRow, InventoryFilters, LadderTimeline,
               DeviceDrawer, DeviceActions
  exceptions/  ExceptionRow, ExceptionDrawer, ExceptionTypeChips,
               ReturnDrawerBody, PlainCaseBody, ConfirmRefundDialog
  hubs/        HubRow, HubDrawer
  users/       UserRow, UserAccessDrawer
  metrics/     MetricTile, MetricSparkline, DaysToSellBars
  demo/        BusinessClockCard, DemoModeSwitch, PayoutFailureSwitch
profile/       ProfileScreen, ProfileForm, ProfileIdentity, ProfileAvatarEditor,
               ProfileReadOnly
help/          SupportForm
```

Conventions: one default export named after the file; props in, events out; no data fetching inside a presentational component (a screen or a hook fetches); `cn()` for conditional classes; icons from `lucide-react` only.

## 4. Data access

```
screen ──▶ hook (TanStack Query) ──▶ read model (server) ──▶ entity store
   ▲                                     │
   └────── command (POST) ───────────────┘  then invalidate the query
```

- **Reads** never join in the browser. A read model returns exactly the fields the audience may see (e.g. the buyer's order bundle has no seller id, cost or floor).
- **Writes** go through a command endpoint; the UI then invalidates the affected query keys (workspace context, deals, order, queue…) instead of recomputing locally.
- **Optimistic UI** is allowed only for non-money state: marking a notification read, toggling a filter. Never for a price or a status.
- Two client-side mirrors exist for display-only arithmetic (grade price fallbacks, ladder preview). If they ever disagree with the server, the server wins — the mirrors are for "what will happen if" copy, not for writes.

Hooks (`src/hooks/`): `use-workspace` (settings + business date, 30 s stale), `use-submission`, `use-seller-deals`, `use-deal-tracker`, `use-catalogue`, `use-liquidity-board`, `use-notifications`, `use-signed-photo`.

## 5. Design system

Tokens live in `src/index.css` as HSL channels; `tailwind.config.js` maps them to Tailwind classes. **Never hardcode a colour or font in JSX.**

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--background` | `216 26% 96%` (#F3F5F8) | `222 36% 7%` | page |
| `--card` | `0 0% 100%` | `221 30% 10%` | surfaces |
| `--foreground` | `220 54% 13%` | `213 30% 96%` | text |
| `--primary` | `221 74% 17%` (#0B1F4B navy) | `213 82% 68%` | primary buttons, links |
| `--secondary`, `--muted`, `--accent` | greys | greys | quiet surfaces |
| `--success` | `160 84% 34%` | `160 66% 45%` | paid, released, accepted |
| `--warning` | `35 71% 42%` | `35 78% 58%` | pending, due, review |
| `--destructive` | `6 63% 46%` | `6 68% 58%` | failed, refunded, rejected |
| `--border`, `--input`, `--ring` | `215 27% 91%` | `220 20% 21%` | hairlines, focus |
| `--radius` | `1.125rem` | | cards 18 px, inputs 14 px |

Typography roles: `--font-heading` **Onest** (600/500, tight tracking) for headings and UI; `--font-display` **Instrument Serif** for large numerals and money moments; `--font-body` Onest for text; `--font-mono` for tags and ids. Money uses `font-display text-4xl` with `tabular-nums` where figures align.

Utility classes defined in `index.css`: `.surface` (card), `.field-label`, `.meta`, `.no-scrollbar`, `.animate-rise`, `.animate-fade`. Focus is globally visible: `:focus-visible` gets a 2 px ring at 2 px offset on every interactive element.

Component rules:

- **Tiles over fields.** Seller inputs are pill groups and cards with a title and a one-line hint; free text appears only for IMEI and notes.
- **One chip language.** `StatusChip` (label + tone) everywhere; `GradeChip` for A–D with a fixed palette (A green, B blue, C yellow, D grey).
- **Numbers are never ambiguous**: money always ₹ with `en-IN` grouping, dates always `Wed, 4 Nov`, relative countdowns ("closes in 3 days") for windows.
- **Empty states** name the next action ("Nothing listed yet — start a submission"); loading uses skeletons or a spinner with a label; errors state what happened and what to do.
- **Explain the money.** Any screen showing an amount shows how it was derived (market → commission → fee → you get).

## 6. Screen composition patterns

- **Wizard** (`/seller/sell/:id/*`): a step rail, one decision per screen, a sticky footer with the primary action and a back link. State lives on the submission record, so a refresh resumes the same step.
- **Tracker** (`/seller/deals/:id`, `/shop/orders/:id`): header with status and next action → money card → timeline → supporting cards (booking, payments, refund) → help link.
- **Console table** (`/ops/inventory`, `/catalogue`, `/users`): filters row, table with sticky header, row opens a drawer (edit form + actions), pagination or "load more".
- **Exception drawer**: left column evidence (photos, report, reason, maths), right column the resolution form — one primary action, destructive ones behind a confirm dialog.
- **Hub job**: a stack of step cards, one per visit, with the next step only enabled when the server says the precondition holds.

## 7. Responsiveness

Breakpoints: `<640` phone, `640–1024` tablet, `>1024` desktop (preview is typically 1440–1630 px). Rules: the header collapses to a sheet-driven nav below `lg`; tables become card rows below `md`; sidebars become drawers; wizard footers stay thumb-reachable; no horizontal scrolling except intentional chip rails; tap targets ≥ 40 px.

## 8. Accessibility & polish checklist

Keyboard reachable in DOM order; visible focus; `aria-pressed` on toggle chips; icon-only buttons carry `aria-label`; states are announced with `aria-live` in async panels; colour is never the only signal (status = label + tone); images have alt text or are `aria-hidden`; reduced-motion users get no entrance animation (`prefers-reduced-motion`); signed private media renders through a short-lived signed URL component so a screenshot/recording never captures a raw link.

## 9. Error, loading and session handling

- Session resolves before any guard decides; `isLoadingAuth` renders a spinner, never a redirect.
- A signed-out visitor is sent to `/login?returnTo=<current path>` and comes back to that path (validated same-origin).
- Server errors surface the endpoint's message ("The return window closed on 4 Nov"), not a stack trace.
- Failed money commands leave the UI untouched (no optimistic money).
- Private files render via a signed URL that expires in minutes; an expired one re-signs on mount.
