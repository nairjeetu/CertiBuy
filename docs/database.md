 CertiBuy — Database

21 domain tables plus the `User` record (in the rebuild: the auth user + a `profiles` row), and a set of infrastructure tables (§9a) added by the rebuild. All money is an integer number of rupees. All business days are `yyyy-mm-dd` strings evaluated in `Asia/Kolkata`. All timestamps are ISO-8601 strings. Every table gets `id`, `created_date`, `updated_date`, `created_by_id` from the platform — below only the domain fields are listed.

Naming: `snake_case` columns, singular entity names. Enums are listed with their stored values; every enum must also be mapped to a label + tone in `src/lib/statuses.js`.

---

## 1. `Settings` (single record)

Every fee, percentage, day count, threshold and cap in the product. Read on the server per request; never cached in the client beyond a short stale window.

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| commission_pct | number | 15 | CertiBuy's cut of the grade market price |
| inspection_fee | number | 200 | Deducted from every offer |
| mismatch_fee | number | 100 | Charged when the grade is 2+ below the quoted band |
| return_logistics_charge | number | 300 | Deducted on an `as_shipped` return |
| change_mind_fee | number | 500 | Deducted on a change-of-mind return |
| warranty_months | number | 12 | Default warranty on a listing |
| warranty_addon_pct | number | 5 | Second-year add-on price (never on grade D) |
| advance_pct | number | 50 | Sell For More advance at handover |
| balance_day | number | 21 | Day the balance is paid if unsold |
| payout_max_attempts | number | 3 | Attempts before a payment hold |
| step1_day / step1_pct | number | 15 / 7 | First ladder step |
| step2_day / step2_pct | number | 30 / 12 | Second ladder step |
| review_day | number | 45 | Day-45 review |
| alert_window_days | number | 3 | Reminder horizon |
| return_window_days | number | 7 | Buyer return window |
| liquidity_threshold | number | 60 | Score needed for Instant Cash |
| near_band | number | 10 | Margin above threshold for "fast-selling" risk |
| risk_small_pct / risk_large_pct | number | 5 / 12 | Instant Cash risk haircut |
| launch_window_days / launch_tighten_pts | number | 30 / 10 | Successor launch: window and threshold tightening |
| liq_w_days / liq_w_demand / liq_w_volatility / liq_w_launch | number | 40 / 25 / 20 / 15 | Liquidity score weights |
| liq_review_penalty | number | 6 | Score penalty per day-45 return |
| inventory_cap | number | 15000000 | Total owned-stock cost cap |
| per_model_cap | number | 1500000 | Per-model exposure cap |
| price_band_min / price_band_max | number | 20000 / 150000 | Tradeable price band |
| grade_factor_b / c / d | number | 0.91 / 0.82 / 0.6 | Fallback price factors |
| battery_a_min / b_min / c_min | number | 90 / 85 / 80 | Battery grade floors (%) |
| photo_retake_medium | number | 1 | Retakes above which confidence is Medium |
| photo_min_px / photo_min_brightness | number | 600 / 60 | Browser photo quality gates |
| offer_expiry_days | number | 7 | Offer lifetime |
| checkout_hold_minutes | number | 15 | How long a listing is held for a `pending` order awaiting payment (async payment mode) |
| cancel_fee | number | 0 | Deducted when a buyer cancels a paid order before dispatch; 0 = full refund |
| hub_cost | number | 350 | Per-job hub cost used by metrics |
| demo_mode | boolean | true | Enables demo controls and role preview |
| sim_day_offset | number | 0 | Business-clock offset in days |
| simulate_payout_failure | boolean | false | Forces payout failures for demos |

Access: read by every signed-in user (the UI shows the grade floors); write admin only.

## 2. `User` (platform table, domain fields)

| Field | Type | Meaning |
| --- | --- | --- |
| app_role | enum `customer` \| `technician` \| `ops` (default `customer`) | permission axis; admin-only write |
| active_mode | enum `buyer` \| `seller` | a customer's view preference; self-write |
| phone, city, avatar_url | string | profile |
| payout_account | string | seller's payout reference |
| delivery_address | string | buyer default address |
| hub_id | string | technician's hub; admin-only write |
| trust_score | number (default 100) | reduced by mismatches; admin-only write |
| return_count | number (default 0) | lifetime returns; incremented by `raiseReturn`; admin/system write |
| account_flagged | boolean (default false) | ops flag; admin-only write |
| is_platform_admin | boolean (default false) | rebuild replacement for the platform `role = admin`; admin-only write |

Built-ins (`id`, `email`, `full_name`) are managed by the auth layer. In the reference build `role` (`admin`/`user`) was the platform role; in the rebuild it is `is_platform_admin` on `profiles`. `app_role` is the business role. `profiles.id` equals the auth user id; a new auth user gets a `profiles` row with `app_role = customer` once, server-side.

## 3. Catalogue

### `DeviceModel`

| Field | Type | Notes |
| --- | --- | --- |
| brand, model, storage | string | `model` excludes storage ("iPhone 14", "Galaxy S24 Ultra") |
| category | enum `phone` \| `laptop` \| `tablet` \| `watch` | drives photo shot list |
| colours | string[] | picker options |
| image_url | string | catalogue image (public) |
| launch_date, successor_launch_date | `yyyy-mm-dd` | successor drives the launch window |
| original_price | number | launch price, for context only |
| market_price_a/b/c/d | number | B–D fall back to A × factor when empty |
| b2b_floor_price | number | **the floor price**: the ladder never prices below it, and day-45 B2B liquidation sells at it. Required for every active model; never exposed to buyers/sellers |
| price_is_placeholder | boolean | price is an estimate, not a checked market price (badge in ops) |
| liquidity_tier | enum `high` \| `medium` \| `low` | cold-start score: 80 / 65 / 45 |
| ic_paused | boolean | Instant Cash paused for this model |
| active | boolean | usable in the seller picker |

### `LiquidityScore`

| Field | Type | Notes |
| --- | --- | --- |
| device_model_id | string | FK DeviceModel |
| score | number 0–100 | current score |
| days_to_sell | number \| null | measured median |
| volatility | number \| null | % spread of achieved prices |
| launch_window | number | 1 when a successor is inside the window |
| source | string | `measured` \| `cold_start` \| `seeded` |
| calculated_at | ISO timestamp | |
| is_current | boolean | exactly one current row per model (recalc flips the rest off) |

### `Hub`

name, type (`flagship`\|`partner`), address, city, pincode, slot_times (string[]), daily_capacity, distance_km, active.

### `BlacklistedImei`

imei (unique), reason. Ops-maintained cache of a registry check.

## 4. Selling

### `Submission`

| Field | Type | Notes |
| --- | --- | --- |
| seller_id | string | owner |
| device_model_id, colour, imei | | device identity |
| age_months | number | from the age tiles |
| declared_cosmetic | enum `A`\|`B`\|`C`\|`D` | "Like new … Heavy wear" |
| repaired | enum `no`\|`authorised`\|`other_shop`\|`not_sure` | `other_shop` is a hard reject |
| water_exposure | boolean | hard reject |
| bill_box | enum `bill_and_box`\|`bill_only`\|`box_only`\|`neither` | |
| warranty_status | enum `in_warranty`\|`expired`\|`unknown` | |
| photos | object[] | `{key, label, url, brightness, at}` |
| retake_count | number | lowers confidence above threshold |
| diagnostics | object | 9 checks + battery health + grades written back |
| status | enum `draft`\|`graded`\|`offer_accepted`\|`scheduled`\|`inspected`\|`revised_offer`\|`accepted`\|`rejected`\|`abandoned` | `revised_offer`: inspection landed one grade below the quoted band, seller must accept or decline |
| reject_reason | string | human-readable |
| chosen_option | enum `instant_cash`\|`sell_for_more` | |
| consent_at | ISO timestamp | terms accepted |
| current_offer_id | string | the live offer |
| final_grade | enum `A`–`D` | confirmed by the technician |
| mismatch_fee_status | enum `none`\|`pending`\|`paid`\|`waived` | |

### `Offer`

submission_id, seller_id, version (int), priced_band (string[] e.g. `["A","B"]`), instant_cash_amount, guaranteed_price, ic_eligible, ic_reason, risk_pct, risk_tier (`low`\|`medium`\|`high`), breakdown (object: market, commission, fee, risk, option labels), expires_at, status (`active`\|`accepted`\|`declined`\|`expired`).

### `GradeAssessment`

submission_id, seller_id, source (`ai`\|`technician`), band (string[]), estimate (grade), confidence (number 90/70/45), confidence_level (`High`\|`Medium`\|`Low`), factors (object: list, battery_grade, cosmetic_grade, function_grade), final_grade, set_by, component_grades (object), variance (number).

### `Booking`

submission_id, hub_id, seller_id, date (`yyyy-mm-dd`), slot (`HH:MM`), status (`booked`\|`completed`\|`cancelled`\|`no_show`).

## 5. Inspection

### `InspectionReport`

| Field | Type | Notes |
| --- | --- | --- |
| type | enum `intake` \| `return` | |
| submission_id, hub_id, technician_id | string | |
| checklist | object | `{screen:"pass", …}` |
| battery_health | number | |
| cosmetic_grade | enum `A`–`D` | |
| photos | object[] | |
| computed_grade | enum `A`–`D` | server-computed |
| component_grades | object | `{battery, cosmetic, functions}` |
| ai_band | string[] | what the seller was quoted |
| verdict | enum `inside` \| `one_below` \| `two_below` | |
| quoted_amount, revised_amount | number | from the offers |
| seller_decision | enum `pending`\|`accepted`\|`declined`\|`fee_paid`\|`fee_due` | |
| sealed, sealed_at | boolean, timestamp | sealing is a precondition of handover |
| tag_id | string | `CB-#####` custody tag |
| signature_url | string | private file of the seller's signature |
| scanned_imei, blacklist_clear, activation_lock_off, identity_passed | | identity step |
| return_recommendation | string | `faulty` \| `as_shipped` \| `doa_confirmed` for return reports |

## 6. Inventory

### `Device`

submission_id, seller_id, device_model_id, colour, imei, tag_id, final_grade (`A`–`D`), payout_option (`instant_cash`\|`sell_for_more`), acquisition_cost (what CertiBuy paid/owes), owner (`certibuy`), custody_at (`yyyy-mm-dd` handover day), hub_id, balance_paid (boolean), parts_replaced (string[]), return_count (number), status (`in_refurbishment`\|`listed`\|`day45_review`\|`reserved`\|`shipped`\|`delivered`\|`settled`\|`returned`\|`liquidated`).

### `Listing`

device_id, base_price, current_price, floor_price, ladder_step (0–2), listed_at (`yyyy-mm-dd`), reserved_days (number), override_price, override_by, override_at, warranty_months, status (`active`\|`reserved`\|`sold`\|`review`\|`liquidated`\|`inactive`).

`days_listed = today − listed_at − reserved_days`. Step 1 from day 15, step 2 from day 30, review from day 45. An `override_price`, when set, stops the ladder.

- `floor_price` is **always** copied from `device_model.b2b_floor_price` when the listing is created — first listing and relist alike (one definition; replaces the reference build's acquisition-cost floor, audit F10). The ladder never prices below it; at day 45 the expected outcome is B2B liquidation at this price.
- `warranty_months = 0` for a grade-D listing. Grade D is never listed at handover: it goes to refurbishment and is listed with no warranty when ops marks it refurbished (audit F9). The warranty add-on is never offered on a 0-month listing.
- A cancelled order puts its listing back to `active` with `reserved_days` kept.

## 7. Buying

### `Order`

listing_id, device_id, buyer_id, device_price, warranty_addon (boolean), warranty_addon_amount, total, delivery_name, delivery_phone, delivery_address, payment_method (`upi`\|`card`\|`netbanking`), status (`pending`\|`paid`\|`dispatched`\|`in_transit`\|`delivered`\|`settled`\|`refunded`\|`replaced`\|`cancelled`), escrow_status (`hold`\|`released`\|`refunded_full`\|`refunded_partial`\|`held_replacement`), paid_at, dispatched_at, in_transit_at, delivered_at, return_window_closes_at, settled_at, refund_amount, refunded_at, replacement_device_id, hold_expires_at, cancelled_at, cancel_reason.

- `return_window_closes_at = delivered_at + return_window_days` — the window starts at **delivery**.
- `pending` is used only by the async payment mode: the listing is held until `hold_expires_at` (`checkout_hold_minutes`); an unpaid order past its hold becomes `cancelled`.
- `cancelled` is written by `cancelOrder` (buyer or ops, only while `pending` or `paid`, i.e. before dispatch) or by hold expiry. A paid order that is cancelled gets `escrow_status = refunded_full` (or `refunded_partial` if `cancel_fee > 0`) and `refund_amount = total − cancel_fee`.

### `EscrowTransaction`

order_id, buyer_id, type (`hold`\|`release`\|`refund_full`\|`refund_partial`), amount, note.

Refund rows are written by `resolveReturn` (returns) and by `cancelOrder` (pre-dispatch cancellation, `note` = "Cancelled before dispatch"). At most one `release` and one refund row per order (partial unique indexes). Append-only: corrections are compensating rows.

### `ReturnRequest`

order_id, buyer_id, device_id, hub_id, reason + buyer_reason (`not_as_graded`\|`dead_on_arrival`\|`buyer_changed_mind`), buyer_reason_note, note, photos, doa_preference (`refund`\|`replacement`), status (`awaiting_reinspection`\|`awaiting_decision`\|`resolved`), recommendation (`faulty`\|`as_shipped`\|`doa_confirmed`), report_id, outcome (`faulty`\|`as_shipped`\|`doa_confirmed`\|`doa_replacement`\|`changed_mind`), original_amount, deduction_amount, deduction_label (`shipping_charges`\|`return_logistics`), refund_amount, replacement_device_id, resolved_by, resolved_at.

## 8. Money

### `Payout`

seller_id, submission_id, device_id (nullable — a `mismatch_fee` is raised when the device goes back to the seller, so no device exists), type (`instant_cash_full`\|`advance`\|`balance`\|`mismatch_fee`), amount, trigger (`custody_handover`\|`buyer_paid_escrow`\|`day_21_unsold`\|`inspection_mismatch`), status (`pending`\|`approved`\|`paid`\|`failed`\|`due`), attempts, failure_reason, paid_at.

Uniqueness rules: one `balance` per device; `advance + balance = guaranteed_price`; for a Sell For More deal, `completeHandover` creates the `due` balance row alongside the advance, so the seller sees the promise; it becomes `pending` when the buyer pays or on `custody_at + balance_day`, whichever comes first. A buyer cancellation never reverses or deletes a seller payout.

## 9. Operations

### `ExceptionCase`

type (`return`\|`failed_inspection`\|`grade_dispute`\|`payment_hold`), title, detail, related_entity, related_id, status (`open`\|`resolved`), resolution.

### `ActivityLog`

actor_id, actor_name, text, entity, entity_id, business_date. Append-only human timeline; powers the ops activity feed and deal timelines.

### `Notification`

user_id, event, title, body, link, read, dedupe_key. See `docs/notifications.md` for the event catalogue.

`dedupe_key` (unique when present) is the reminder duplicate check: it is set to `(user_id, event, link)` **only** for the two deduplicated reminder events, `offer_expiring` and `return_window_closing`, so each reminder is sent once and never nightly. For every other event it is null, so repeatable notifications such as `payout_paid` can recur with the same link.

### `SupportRequest`

customer_id, topic (`selling_device`\|`order_delivery`\|`return_refund`\|`payments`\|`other`), related_id, message, status (`open`\|`resolved`), reply, replied_by, replied_at, resolved_by, resolved_at. Read and answered in Ops → Support (audit F11 closed).

## 9a. Infrastructure tables (rebuild)

These carry no business rules; they make the rebuild safe, auditable and ready for real providers. See `docs/architecture.md` §7.

| Table | Purpose |
| --- | --- |
| `payout_attempts` | append-only, one row per (simulated) transfer attempt with its reference and failure reason |
| `payment_intents` | the (simulated) payment reference per order |
| `shipments` | one row per shipment state change (manual courier now) |
| `outbox` | emails waiting to be delivered (simulated in the capstone; shown in Ops → Mail log) |
| `file_objects` | storage key, owner, kind, size — lets the server verify uploads (e.g. the photo count) |
| `settings_history` | every `Settings` change with actor and time; offers store `settings_version` |
| `job_runs` | last run, business date, counts, cursor and status per job |
| `invitations` | staff invitations: email, role, hub, invited_by, status, expires_at |
| `idempotency_keys` | replay-safe command responses |
| `rate_limits` | Postgres-based counters for the help form, grading and orders |

## 10. Relationships

```
User 1─n Submission 1─n Offer
                    1─1 Booking (live)
                    1─1 InspectionReport (intake)
                    1─1 Device ─1─1 Listing          (after handover)
Device n─1 DeviceModel 1─n LiquidityScore (history, 1 current)
Device 1─n Payout
Order n─1 Listing, n─1 Device, n─1 User(buyer)
Order 1─n EscrowTransaction
Order 1─n ReturnRequest
ReturnRequest 1─1 InspectionReport (return)
Hub 1─n Booking, 1─n Device(custody), n─1 User(technician).hub_id
ExceptionCase n─1 (ReturnRequest | Payout | Submission)
```

## 11. Indexes & query shapes

On a SQL database create these (the reference build relies on filtered list queries):

- `submissions (seller_id, status, -created_date)`
- `offers (submission_id, status, -created_date)`, `offers (status, expires_at)`
- `listings (status, current_price)`, `listings (device_id)`
- `devices (owner, status)`, `devices (device_model_id)`, `devices (submission_id)`
- `orders (buyer_id, -created_date)`, `orders (listing_id)`, `orders (status, delivered_at)`
- `returns (buyer_id, status)`, `returns (status, -created_date)`
- `payouts (seller_id, -created_date)`, `payouts (status)`, `payouts (device_id)`
- `notifications (user_id, read, -created_date)`
- `bookings (hub_id, date, status)`
- `liquidity_scores (device_model_id, is_current)`
- `activity_log (-business_date)`, `exception_cases (status, type)`
- `orders (status, hold_expires_at)`, `support_requests (status, -created_date)`

Partial unique indexes (rebuild): `payouts(device_id) WHERE type='balance'`; `escrow_transactions(order_id) WHERE type='release'`; `escrow_transactions(order_id) WHERE type IN ('refund_full','refund_partial')`; `return_requests(order_id) WHERE status <> 'resolved'`; `liquidity_scores(device_model_id) WHERE is_current`; `devices(submission_id)` unique.

## 12. Access rules

Full matrix in `docs/roles.md` § 6. The short version: money and status tables are **system-write only**; customers read their own rows (plus live listings, the catalogue, hubs, grades and settings); ops/admin read everything; technicians are scoped to their hub; notifications are per-user; `ExceptionCase`, `ActivityLog`, `BlacklistedImei`, `invitations`, `outbox` and `job_runs` are ops-only; `SupportRequest` is readable by its customer (including the reply) and by ops.

## 13. Migrating to SQL — mapping notes

| Reference concept | SQL |
| --- | --- |
| `{{user.id}}` | `app.current_user_id()` — on Supabase a wrapper around `auth.uid()`; on any other Postgres redefined to read a per-transaction setting, so policies stay portable |
| `user_condition: {data.app_role: "ops"}` | `exists(select 1 from profiles p where p.id = app.current_user_id() and p.app_role = 'ops')` |
| array enums | `text` + `CHECK` constraint (keeps the label/tone mapping in one place) |
| `object` fields (checklist, breakdown, factors) | `jsonb` |
| record rules on read | `USING (...)`; on write | `WITH CHECK (...)` |
| server functions | service-role key inside trusted handlers only |
| business date | `(now() at time zone 'Asia/Kolkata')::date + coalesce((select sim_day_offset from settings),0)` |

Never put the service-role key in the browser; every write goes through an endpoint that re-checks the caller. In the rebuild the schema is managed by Prisma migrations (portable SQL); Supabase-only SQL (the `auth.users` link, `current_user_id()`, storage policies) lives separately — see `docs/architecture.md` §7.
