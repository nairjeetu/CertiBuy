CertiBuy — API

Two kinds of endpoint:

- **Commands** — `POST` only, one per business action, side-effectful, server-authoritative. Path in the rebuild: `POST /api/v1/commands/<name>` (reference build: `/functions/<name>`). They are the *only* way money or status changes.
- **Read models** — `GET`, one per screen (or screen group), returning exactly the fields that audience may see. Path in the rebuild: `GET /api/v1/views/<name>` (reference build: `/fns/<name>`).

Every action that changes data is a command, including the ops actions listed in the § 7 table (`setListingOverride`, `savePricingSettings`, `saveHub`, …) — those are `POST` commands even though they sit next to the read models they serve.

Both carry the caller's auth token (`Authorization: Bearer <token>`); both return JSON. Errors are `{ "error": "<sentence the UI can show>" }` with `400` (validation), `401` (not signed in), `403` (wrong role / not owner / wrong hub), `404` (missing), `409` (business conflict), `422` (invalid slot/day), `500`.

Common conventions: ids are opaque strings; money is integer rupees; dates are `yyyy-mm-dd`; timestamps ISO-8601; all server code re-reads `Settings`, re-derives prices and re-checks roles regardless of what the client sent.

**Simulation note.** Every contract below is real, but the capstone build fakes these external effects behind adapters: `placeOrder` authorises without capturing (no gateway), refunds (`resolveReturn`, `cancelOrder`) are ledger-only, `attemptPayout` walks a status machine without transferring (failures only occur when `Settings.simulate_payout_failure` is on), shipment states are advanced manually, grading is the deterministic engine, and notification email is written to an outbox instead of being delivered. A real integration must preserve the request/response shapes and do the external call inside those handlers (`docs/architecture.md`, §19).

> Commands are plain `POST` routes with JSON bodies, called with the caller's session. No platform client or vendor SDK is involved.

---

## 1. Commands — selling

### `gradeSubmission` — S-06
`POST { submissionId }` · auth: seller of the submission, or admin.

First verifies on the server that every required photo for the category (8 phone / 5 other) is present in storage, `400` otherwise (closes audit F5). Then runs the reject gates in order (blacklisted IMEI → activation lock → water exposure → third-party repair → invalid IMEI/Luhn). On a hit: submission → `rejected` with `reject_reason`, returns `{ok:false, rejected:true, code, reason}`. Otherwise computes battery/cosmetic/function grades → estimate → confidence (`High`/`Medium`/`Low`) → band, writes a `GradeAssessment` (`source:"ai"`), builds the offer, sets submission `graded`.

```json
{ "ok": true, "assessment": {...}, "band": ["A","B"], "confidence": "High",
  "factors": ["Battery health 92% → grade A", "..."],
  "valueRange": {"low": 43000, "high": 47000},
  "offer": {...}, "guaranteedPrice": 47000, "instantCashAmount": 42500 }
```

### `computeOffer` — S-07
`POST { submissionId, band?, confidence? }` · seller or admin. Re-prices without re-grading (used when a band changes). Returns the offer fields; writes a new `Offer` version.

### `icEligibility` — S-08
`POST { modelId, confidence? }` · signed-in customer.

```json
{ "eligible": true, "score": 72, "threshold": 60, "launchWindow": false,
  "riskPct": 5, "tier": "Fast-selling", "reason": null, "reasonLabel": "fast_selling",
  "inventoryTotal": 640000, "modelExposure": 132000 }
```
Ineligible `reasonLabel`s: `paused`, `low_confidence`, `low_liquidity`, `launch_window`, `inventory_cap`, `model_cap` — each with a seller-readable `reason`.

### `acceptOffer` — S-09
`POST { submissionId, option: "instant_cash"|"sell_for_more", consent: true }` · seller or admin.
Requires consent. Expires any other live offer, marks this one `accepted`, submission → `offer_accepted`, stores `chosen_option` + `consent_at`. Returns `{ok, option, amount, expiresAt}`.

### `manageBooking` — S-12 (edit)
`POST { submissionId, action: "switch_to_guaranteed" | "cancel" }` · seller or admin.
`switch_to_guaranteed`: moves an Instant Cash deal onto the guaranteed price (blocked if already `sell_for_more`). `cancel` (or anything else): cancels live bookings, submission back to `offer_accepted`, releases the slot. Returns `{ok, option|released}`.

### `bookInspection` — S-12
`POST { submissionId, hubId, date, slot }` · seller or admin.
Validates: payout option chosen, offer exists, hub active, date within the next **5 days**, slot in `hub.slot_times`, free capacity for the day. Cancels the seller's previous live booking, creates the new one, submission → `scheduled`. `409` if the slot was taken in the meantime.

### `reviseOffer` — T-05
`POST { submissionId }` · staff.
Requires a confirmed grade. If an active offer already prices exactly that grade it is **reused** (`reused:true`, idempotent). Otherwise prices `[finalGrade]` and writes `quoted_amount` / `revised_amount` on the report.

```json
{ "ok": true, "reused": false, "offerId": "...", "quoted": 47000, "revised": 41000,
  "option": "sell_for_more", "finalGrade": "B", "icEligible": false, "icReason": "low_liquidity" }
```

### `acceptRevised` — S-14
`POST { submissionId }` · seller or admin. Marks the offer `accepted`, submission → `accepted`, report `seller_decision: "accepted"`, completes the booking. Returns the agreed amount.

### `declineRevised` — S-14
`POST { submissionId }` · seller or admin. Idempotent (`already:true` if abandoned). Offer `declined`, submission → `abandoned`, report `declined`, booking `cancelled`.

### `rejectForMismatch` — T-05
`POST { submissionId, feePaid?: boolean }` · staff.
Submission → `rejected` (`mismatch_fee_status` `paid`/`pending`), offer `declined`, a `Payout` of type `mismatch_fee` (₹100) is created when the fee was collected, the seller's `trust_score` is reduced, an `ExceptionCase` (`grade_dispute`/`failed_inspection`) is opened, report `seller_decision` set, booking `completed`. Returns `{ok, fee, feeStatus}`.

### `rejectDevice` — T-07
`POST { submissionId, reasonCode, note? }` · staff. Submission → `rejected`, booking `completed`, seller notified; an `ExceptionCase` is raised when the IMEI did not match.

## 2. Commands — inspection

### `verifyIdentity` — T-02
`POST { submissionId, scannedImei, activationLockOff: boolean }` · staff, hub-scoped.
Compares scanned vs declared IMEI (last-8-digit match), checks `BlacklistedImei`, writes `identity_passed`, `blacklist_clear`, `activation_lock_off`, `scanned_imei` on the report. Returns `{ok, passed, imeiMatch, blacklisted, activationLockOff}`. Grading is blocked until this passes.

### `confirmGrade` — T-03/T-04
`POST { submissionId, checklist: {item: "pass"|"fail"}, batteryHealth, cosmeticGrade, photos: [] }` · staff, hub-scoped.
Validates: identity step done, every checklist item answered, battery 50–100, cosmetic grade A–D. Computes `componentGrades` (battery by Settings floors, cosmetic as declared, functions by failed count), final grade = worst, verdict vs the AI band, quoted vs revised amounts. Writes the sealed report (`sealed:true`) and submission → `inspected`.

```json
{ "ok": true, "reportId": "...", "finalGrade": "B",
  "componentGrades": {"battery":"A","cosmetic":"B","functions":"A"},
  "worstKey": "cosmetic", "band": ["A","B"], "verdict": "inside",
  "quoted": 47000, "revised": 47000 }
```

## 3. Commands — custody & handover

### `completeHandover` — T-06
`POST { submissionId, sealed: true, tagId: "CB-12345", signatureUrl }` · staff, hub-scoped.
Preconditions: submission `accepted`, report sealed, bag sealed, tag matches `^CB-\d{5}$`, signature present, no device exists yet for the submission. Creates the `Device` (custody, grade, cost), the first `Payout` (`instant_cash_full` or `advance`) and — for Sell For More — the `due` balance payout, and the `Listing` at the confirmed grade price with the grade's warranty and `floor_price = model.b2b_floor_price`. **Grade D** creates no listing: the device goes to `in_refurbishment` (`listingId: null`) and is listed later with no warranty via `markRefurbishedAndList`. Marks the booking completed.

```json
{ "ok": true, "deviceId": "...", "listingId": "...", "payoutId": "...",
  "paid": 41000, "option": "sell_for_more", "listingPrice": 47000, "warrantyMonths": 12 }
```

## 4. Commands — buying

### `placeOrder` — B-05
`POST { listingId, deliveryName, deliveryPhone, deliveryAddress, paymentMethod: "upi"|"card"|"netbanking", warrantyAddon?: boolean, declined?: boolean }` · signed-in customer.
Validates name ≥ 2 chars, a valid 10-digit Indian mobile (leading `91` normalised), address ≥ 10 chars, listing `active` (expired holds on that listing are cleared first), device owned by CertiBuy. Price comes from the listing (override first), plus the add-on when allowed (never on a 0-month / grade-D listing). `declined:true` returns `{declined:true, total}` and writes nothing.

On success (instant payment mode, the default): `Order` (`paid`, escrow `hold`), `PaymentIntent` (simulated), `EscrowTransaction(hold)`, listing → `reserved` (`reserved_days:1`), device → `reserved`, the Sell For More balance payout becomes payable, notifications, activity log.

Async payment mode (demo toggle; the shape a real gateway needs): the order is created `pending` with `hold_expires_at = now + checkout_hold_minutes`, the listing is reserved, and the response carries `{orderId, status:"pending", holdExpiresAt}`. `confirmPayment { orderId }` (simulated payment page) moves it to `paid` with the side effects above; an unpaid order past its hold is cancelled and the listing released.

### `cancelOrder` — B-12
`POST { orderId, reason? }` · the buyer of that order, or ops/admin.
Allowed only while the order is `pending` or `paid` (before dispatch); otherwise `409 "This order has already been dispatched. You can raise a return after delivery."`. Idempotent (`already:true` if already cancelled).

- `pending` → order `cancelled`; listing → `active`; device → `listed`; no money moved.
- `paid` → refund `total − Settings.cancel_fee` (default fee 0, i.e. a **full refund**): `EscrowTransaction(refund_full)` (or `refund_partial` when a fee applies), order `cancelled` with `escrow_status` `refunded_full`/`refunded_partial`, `refund_amount`, `cancelled_at`; listing → `active` (`reserved_days` kept); device → `listed`.
- A cancellation **never reverses a seller payout**.
- Notifies the buyer (`order_cancelled` ✉), writes an activity log line.

```json
{ "ok": true, "orderStatus": "cancelled", "refund": 47000, "deduction": 0, "escrow": "refunded_full" }
```

The ₹500 change-of-mind deduction is a **return** deduction only; it never applies to a cancellation.

### `advanceShipment` — B-07 / ops
`POST { orderId }` · ops/admin, or the buyer of that order while demo mode is on.
`paid → dispatched → in_transit → delivered` (delivered sets the device to `delivered` and starts the return window). `409` when there is no next state.

## 5. Commands — returns

### `raiseReturn` — B-09
`POST { orderId, reason: "not_as_graded"|"dead_on_arrival"|"buyer_changed_mind", note?, doaPreference?: "refund"|"replacement", photos?: [] }` · buyer.
Validates owner, `delivered`/`settled` state, inside the return window (which starts at delivery), no open return already. Creates the `ReturnRequest` (`awaiting_reinspection`), an `ExceptionCase(type:"return")`, increments `device.return_count` **and the buyer's `return_count`**. Returns the request plus the estimated refund (`original`, `deduction`, `refund`).

### `returnInspection` — T-08
`POST { returnId, recommendation: "faulty"|"as_shipped"|"doa_confirmed", checklist?, batteryHealth?, notes? }` · staff, hub-scoped.
Writes an `InspectionReport(type:"return")`, sets `recommendation` + `report_id`, moves the return to `awaiting_decision`, notifies ops.

### `resolveReturn` — O-07
`POST { returnId, outcome, reason? }` · ops/admin.
Outcome must be allowed by the reason. Computes the refund with Settings fees, writes the `EscrowTransaction` (`refund_full`/`refund_partial`), closes the order (`refunded` / `replaced` + `held_replacement`), relists the device at its grade price (day 0, `floor_price = model.b2b_floor_price`, 0-month warranty for grade D) or sends it to refurbishment, allocates a replacement unit for `doa_replacement`, marks the return `resolved`, resolves the linked exception cases, notifies the buyer.

```json
{ "ok": true, "outcome": "faulty", "refund": 47000, "deduction": 0,
  "escrow": "refund_full", "orderStatus": "refunded", "deviceStatus": "in_refurbishment" }
```

## 6. Commands — money & operations

### `retryPayout` — O-07
`POST { payoutId }` · ops/admin. Refuses an already-`paid` payout (`409`). Runs one attempt through the payout state machine; a further failure keeps the exception open.

### `runDailyJobs` — see `docs/automations.md`
`POST { advanceDays?: number, businessDate?: "yyyy-mm-dd", cursor?: string }` · ops/admin (triggered from Ops → Jobs), or an optional scheduler holding `CRON_SECRET`.
The minimal body is `{}`; every step is idempotent and a late run catches up. Work is processed in batches: the response carries `{done, cursor}` and the Jobs page repeats the call until `done`. Returns `{ok, businessDate, done, cursor, counts:{stepped, reviewed, balances, payoutsPaid, payoutsFailed, settled, expiredOffers, noShows, reminders}, …detail arrays}`.

### `processOutbox`
`POST {}` · ops/admin (also run after each command). Delivers pending `outbox` rows through the mail adapter — simulated in the capstone (marked sent, visible in Ops → Mail log). Failures are logged, never fatal.

### `expireCheckoutHolds`
`POST {}` · ops/admin. Cancels `pending` orders past `hold_expires_at` and releases their listings. Expired holds are cleared **only by commands**: this job, `placeOrder` on that listing, and `confirmPayment` from the late buyer (which is refused). Read models never expire or clear a hold; a listing or checkout view simply treats an expired hold as available.

### `advanceDemoClock`
`POST { days: 1–30 }` · ops/admin, demo mode. Adds to `Settings.sim_day_offset` then runs the daily job for the new day; returns the new offset and the job summary.

### `recalcLiquidity`
`POST {}` · ops/admin. Recomputes every active model's score from measured sales, flips `is_current` rows, records `source` (`measured`/`cold_start`), notifies ops when a model crosses the threshold or should pause Instant Cash.

### `computeMetrics`
`POST {}` · ops/admin. Returns nine metrics, each with a target, a direction and eight weekly periods: `mismatch`, `acceptance`, `instant_cash`, `days_to_sell`, `sell_through`, `day21_unsold`, `ageing`, `returns`, `cost_per_acquisition`.

### `seedDemoData`
`POST {}` · ops/admin, only when `demo_mode` is on **and** the environment flag `DEMO_TOOLS_ENABLED` is true. Wipes and re-seeds catalogue, hubs, demo users, devices in every custody state, bookings, orders (including a cancelled one), payouts, exceptions and liquidity history, and purges demo files. Destructive: demo environments only.

## 7. Read models

Each returns a shape built for one screen. Field lists are the minimum contract; extra presentation fields may be added, but a field the audience may not see must never appear (seller id in a buyer payload, acquisition cost anywhere outside ops, floor price outside ops).

| Endpoint | Auth | Returns |
| --- | --- | --- |
| `getWorkspaceContext` | any | `{settings, businessDate, demoMode, integrations:{payments, payouts, courier, grading, mail}}` (each `"simulated"` in the capstone) — cached 30 s in the client |
| `ensureCustomerRole` | signed in | `{app_role, assigned}` — one-time bootstrap when `app_role` is empty |
| `getShopHome` | customer | hero rows: newest listings, grade-A picks, counts, trust copy |
| `getShopCatalogue` | customer | `{items:[card], total, facets:{brands, models, storages}, filters}` — cards carry grade, battery, price, warranty, hub, stepped flag |
| `getListingDetail` | customer | listing + model + grade strip + inspection report (checklist, photos as signed URLs, battery) + price history + hub + buy constraints |
| `getCheckout` | customer | listing summary, delivery defaults from the profile, payment methods, add-on price, return-window promise |
| `getOrderReceipt` | buyer | order number, amounts, escrow state, return-window end |
| `getShopGrades` | customer | grade definitions with the Settings battery floors |
| `getMyOrders` | buyer | `{items:[{id, orderNo, status, device, total, nextAction}]}` |
| `getOrderTracking` | buyer | order + shipment timeline + return-window countdown + payment summary + open return/refund card + `canCancel` and the cancellation refund estimate while `pending`/`paid` |
| `getReturnOptions` | buyer | eligibility (window, existing return), reasons, allowed outcomes, estimated refunds |
| `getReturnJob` | staff | return + buyer reason + report context for re-inspection |
| `getHubQueue` | staff | `{hub, today, date, jobs:[{booking, seller, model, aiBand, confidence, status}], reInspections}` scoped to the technician's hub |
| `getHubJob` | staff | everything one counter visit needs: submission, offer, AI assessment, report, booking, device state, next allowed step |
| `getSellerPayouts` | seller | payouts across deals with type/status/trigger/date + totals |
| `getOpsOverview` | ops | KPIs, needs-attention list, activity feed, hubs today, stock-age buckets |
| `getOpsAlerts` | ops | grouped alerts (day-45 reviews, expiring offers, window closings, IC pauses, payout holds) |
| `getOpsInventory` | ops | devices with custody state, tag, grade, cost, days held, ladder position, filters |
| `setListingOverride` | ops | sets/clears `override_price` (stops the ladder), logs the reason |
| `markRefurbishedAndList` | ops | moves a device in refurbishment or review to `listed` (records `parts_replaced`), optionally resets the ladder to day 0; creates the listing when none exists — **grade D is listed with `warranty_months = 0`** and no warranty add-on; `floor_price = model.b2b_floor_price` |
| `liquidateDevice` | ops | B2B liquidation at the floor price: device `liquidated`, listing `inactive`, audit entry. The primary action for a day-45 review; a one-click ops decision, never automatic |
| `getPricingBoard` | ops | every Settings group + a live worked example of an offer at current values |
| `savePricingSettings` | ops | validates and writes allowed Settings fields (never the demo clock) |
| `setIcPaused` | ops | pauses/resumes Instant Cash for a model, notifies affected live offers |
| `getHubsBoard` / `saveHub` / `setHubActive` | ops | hub CRUD, slot and capacity validation |
| `getUsersBoard` / `saveUserAccess` | ops | directory + role/`hub_id` assignment (server enforces admin-only fields) |
| `inviteStaff` | platform admin only (`is_platform_admin`) | `{email, appRole, hubId?}` → `invitations` row + an invite link returned to copy (no email needed); `hubId` required for technicians. An ops user without `is_platform_admin` gets `403` |
| `acceptInvite` | invited user | applies the invited role/hub to the caller's profile on first sign-in; marks the invitation accepted; expired links are refused |
| `getJobsBoard` | ops | per job: last run, business date, actor, counts, and whether today's daily job has run |
| `getMailLog` | ops | outbox rows (recipient, event, subject, body, status) — the simulated email record |
| `getAuditLog` | ops | paginated `ActivityLog` filtered by actor, entity, date range and text |
| `getExceptionQueue` / `getExceptionDetail` | ops | open cases with the evidence each type needs, and the resolution form's data |
| `resolveExceptionCase` | ops | closes a case with a resolution line; money cases delegate to `resolveReturn` / `retryPayout` |
| `collectMismatchFee` | ops | records a paid mismatch fee, clears `pending` |
| `upholdGrade` | ops | resolves a grade dispute in the buyer's/seller's favour, adjusting price or fee |
| `getSupportTargets` | customer | the caller's deals and orders for the "related" picker |
| `submitSupportRequest` | customer | `{topic, related_id?, message}` → creates `SupportRequest` + emails care (outbox) |
| `getMySupportRequests` | customer | the caller's requests with status and any reply |
| `getSupportInbox` | ops | support requests by status/topic with customer and related deal/order |
| `replySupportRequest` | ops | `{requestId, reply}` → stores the reply and notifies the customer (`support_reply`) |
| `resolveSupportRequest` | ops | `{requestId}` → status `resolved`, `resolved_by`, `resolved_at` |

## 8. Client-side data rules

- Reads are query-keyed (`["shop-catalogue", filters]`, `["order", id]`, `["workspace-context"]`) and invalidated after a command that could change them.
- A command's response is not trusted as the new state of the world; the UI re-reads.
- Pagination: reads that can grow accept `cursor`/`limit` and return `{items, next_cursor, has_more}`.
- Counters (unread notifications, stock counts) come from `count`/`aggregate` on the server, never from counting a loaded page.

## 9. Adding an endpoint

1. Name it after the business verb (`reviseOffer`, not `updateOffer2`), and tag the feature code (`// T-05`).
2. Declare the auth actor in a comment and enforce it in code (`ops`/`admin`, seller-owner, hub scope).
3. Validate input strictly (lengths, enums, numbers in range); reject with a user-readable sentence.
4. Re-read everything you price or gate from the database; never accept an amount or a status from the body.
5. Make it idempotent if a retry is plausible (existing record → return `already:true` or reuse).
6. Write the ledger row (`Payout`, `EscrowTransaction`, `ActivityLog`) in the same handler as the status change.
7. Document it here — input, output, errors, side effects — before merging.
