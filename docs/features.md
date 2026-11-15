CertiBuy — Feature Catalogue

Every feature carries a code. Codes appear in code comments (`// S-04`) so a screen or endpoint can be traced to this table. Money rules live in `docs/overview.md` § 6; endpoint contracts in `docs/api.md`.

Legend: **Actor** = who can reach it. All seller/buyer features require a signed-in `customer`; staff features require `technician`/`ops`; console features require `ops`.

This table describes **intent and behaviour** for the rebuild, including the product decisions taken after the audit (F5, F7, F9, F10, F11, F12, F15, F16 — see `docs/architecture.md`). In the capstone build, payments, refunds, payouts, courier, grading and notification email are **simulated** (`docs/architecture.md`).

---

## S — Selling (seller side)

| Code | Feature | Actor | Behaviour and rules |
| --- | --- | --- | --- |
| S-01 | Sell landing | customer | Hero, two payout options explained, list of the seller's deals with next action; empty state starts a submission. |
| S-02 | Model picker | customer | Category tabs + brand chips + search over the live catalogue. Models outside the price band are visible but disabled with the reason. |
| S-03 | Submission details | customer | Tiles only — no free text. Condition (A–D), repair history, water exposure, accessories, warranty status, age band. IMEI validated (15 digits + Luhn) with inline guidance. Draft is persisted so a seller can resume. |
| S-04 | Photo capture | customer | 8 shots for phones, 5 for laptop/tablet/watch, each with a one-line tip. Each photo is checked in the browser for ≥ `photo_min_px` and ≥ `photo_min_brightness`; retakes lower confidence. The wizard cannot continue until every shot is accepted, and the grading command re-checks on the server that every required photo is stored (closes audit F5). |
| S-05 | Diagnostics | customer | 9 checks (battery, screen/touch, speakers, microphone, cameras, charging, sensors, IMEI/blacklist, activation lock) + battery health %. |
| S-06 | Automatic grade + rejects | customer | Deterministic grading → estimate, band, confidence, factor list. Hard rejects: blacklisted IMEI, activation lock on, water exposure, repair at a non-authorised shop, invalid IMEI. |
| S-07 | Offer screen | customer | Sell For More always; Instant Cash only when eligible (see S-08). Full breakdown: market price, commission, inspection fee, risk, what lands in the bank. Offer expires in 7 days; expiry is shown. |
| S-08 | Instant Cash eligibility | customer | Server check, in order: model paused → confidence low → liquidity score < threshold (+10 near a launch) → portfolio cap (₹1.5 cr) → per-model cap (₹15 L). Every ineligible case shows a plain-language reason. |
| S-09 | Accept + consent | customer | Choose option, tick consent, submit. Re-price on the server; the offer is marked accepted and the submission moves to `offer_accepted`. |
| S-10 | Sell For More progress | customer | Visual split of advance vs balance with the day-21 promise, for `sell_for_more` deals. |
| S-11 | Deal tracking | customer | Status header, next action, booking card, payments table (every payout with type/status/date), deal timeline, help link. |
| S-12 | Hub booking | customer | Hub list (flagship/partner, address, distance, slots), day strip for the next five days, slot grid with capacity; re-booking cancels the previous live booking; confirmation shows what to bring. |
| S-13 | Payout history | customer | All payouts across deals: type, amount, status, trigger, date; failures explain what happens next. |
| S-14 | Post-inspection decision | customer | At the counter: "price stands", "revised price" (accept/decline), or "turned away, fee due". Declining returns the device; accepting moves to handover. |
| S-15 | Deal status vocabulary | customer | One source of labels/tones; a seller always sees "what happens next" rather than a raw enum. |

## B — Buying (buyer side)

| Code | Feature | Actor | Behaviour and rules |
| --- | --- | --- | --- |
| B-01 | Shop home | customer | Curated rows of live listings, trust tiles, grade explanation, entry to browse. |
| B-02 | Browse + filters | customer | Category, brand, model, grade, price presets, storage, warranty-only, search, four sorts. Count shown; empty state suggests widening filters. |
| B-03 | Listing detail | customer | Gallery, grade strip with battery, facts (storage, colour, warranty, hub), **full inspection report**, price history (base vs current, steps shown as a saving), buy card with escrow explanation. |
| B-04 | Grade guide | customer | A–D in buyer language, battery floors read from Settings. Grade D devices are refurbished before sale and listed with **no warranty** (F9). |
| B-05 | Checkout + escrow hold | customer | Delivery name/phone (10-digit, `+91` normalised)/address, payment method (UPI/card/net banking), optional warranty add-on. Price comes from the server. A declined payment writes nothing. Payment is simulated; an async mode holds the listing for `checkout_hold_minutes` while the order is `pending`. |
| B-06 | Order confirmation | customer | Receipt-style summary: order number, what was paid, escrow state, return-window end date, delivery estimate. |
| B-07 | Order tracking | customer | Shipment timeline (paid → dispatched → in transit → delivered → settled), return-window countdown (from delivery), payment summary, refund/replacement card when a return is open, **Cancel order** while not yet dispatched (B-12). |
| B-08 | My orders | customer | All orders with status chip, device, total, next action; empty state links to browse. |
| B-09 | Raise a return | customer | Three reasons; DOA asks refund-or-replacement; note + photos; shows the estimated refund **before** submitting (change-of-mind ₹500, otherwise full). One open return per order; only inside the window. The ₹500 applies to a **return** only, never to a cancellation (B-12). Raising a return increments both the device's and the buyer's `return_count` (F16). |
| B-10 | Return outcome visibility | customer | Refund amount and deduction, or replacement device, or "as shipped" explanation, with escrow state. |
| B-11 | Warranty add-on | customer | Second-year add-on priced as a % of the device price; not offered on grade D or on any 0-month-warranty listing. |
| B-12 | Cancel order before dispatch | customer | While the order is `pending` or `paid`, the buyer can cancel. A paid order gets a **full refund** (`total − cancel_fee`, fee 0 by default), shown before confirming; the listing returns to the shop. Once dispatched, the buyer is told to raise a return after delivery. A cancellation never reverses a seller payout (F7). |

## T — Technician / hub

| Code | Feature | Actor | Behaviour and rules |
| --- | --- | --- | --- |
| T-01 | Hub queue | technician | Today's bookings for the technician's hub (or the first active hub for ops), grouped by slot; shows seller, model, AI band/confidence, status. Day strip to look ahead. |
| T-02 | Identity check | technician | Scanned vs declared IMEI, activation-lock toggle, blacklist lookup; mismatch flag becomes an exception. Blocks grading until passed. |
| T-03 | Inspection checklist | technician | 9 pass/fail items + battery health (50–100 %) + cosmetic grade + up to 10 photos. Component grades computed server-side. |
| T-04 | Grade confirmation | technician | Worst of battery/cosmetic/functions = final grade; verdict vs AI band (`inside` / `one_below` / `two_below`); writes the sealed report with quoted and revised amounts. |
| T-05 | Decision | technician | One-grade drop → revised offer created; seller accepts (→ `accepted`) or declines (→ `abandoned`). Two-or-more drop → mismatch flow. |
| T-06 | Handover | technician | Requires: seller accepted, report sealed, tamper-evident bag sealed, tag `CB-#####` scanned, signature captured. Creates `Device`, first `Payout` (plus the `due` balance for Sell For More), and the `Listing` at the confirmed grade price with the B2B floor as `floor_price`. Grade D creates no listing: the device goes to refurbishment. |
| T-07 | Rejects | technician | Reject with reason (identity failed, IMEI mismatch, unsafe device…); cancels booking, notifies seller, raises an exception where ops must act. |
| T-08 | Return re-inspection | technician | Queue of returns awaiting re-inspection in the hub; records recommendation (`faulty` / `as_shipped` / `doa_confirmed`), checklist, battery, notes; moves the return to `awaiting_decision`. |

## O — Operations console

| Code | Feature | Actor | Behaviour and rules |
| --- | --- | --- | --- |
| O-01 | Overview | ops | KPI cards (orders, GMV, open returns, ageing stock), needs-attention list, activity feed, today's hubs, stock-age chart. |
| O-02 | Alerts | ops | Grouped alerts from the daily job and liquidity runs: day-45 reviews, expiring offers, return windows closing, paused Instant Cash models, payout holds. |
| O-03 | Catalogue | ops | Create/edit device models: brand, model, storage, category, colours, launch & successor dates, original price, grade A–D market prices, B2B floor, liquidity tier, **placeholder-price flag**, IC pause, active. |
| O-04 | Pricing | ops | Every `Settings` value grouped in sections (fees, commission, day counts, ladder, liquidity weights, risk, caps, battery floors, photo limits, warranty) with a live preview of what a change means to a real offer. |
| O-05 | Liquidity board | ops | Per-model score, tier, days to sell, volatility, launch window, exposure vs per-model cap, IC pause toggle, trend sparkline, manual recalc. |
| O-06 | Inventory | ops | Every owned device with custody state, tag, grade, acquisition cost, days held, ladder position; row drawer to reprice, override price, liquidate, pause. **Mark refurbished and list**: grade D is listed with no warranty (F9). **Day-45 review**: "Liquidate to B2B" at the floor price is the primary one-click action; repricing remains possible (F10). |
| O-07 | Exceptions | ops | One queue for returns, failed inspections, grade disputes and payment holds. Return body shows the buyer's reason, the technician's finding, and the resolution form (outcome + refund maths). Payment-hold body offers a retry. |
| O-08 | Hubs | ops | Create/edit hubs: name, type (flagship/partner), address, city, pincode, slot times, daily capacity, distance, active. |
| O-09 | Users | ops | Directory of accounts; change `app_role`, assign `hub_id` to technicians, view trust score, return count and flags. **Invite staff** (F12): email + role (+ hub for technicians) produces an invite link for ops to copy; the role and hub are applied on first sign-in. Staff assignment is the only way into the console. |
| O-10 | Metrics | ops | Nine metrics with eight-week history: grade-mismatch rate, offer-acceptance rate, Instant Cash share, median days to sell, 30-day sell-through, devices reaching day 21 unsold, inventory ageing beyond the review day, not-as-graded return rate, cost per successful acquisition. Each carries a target, a direction and a one-line purpose. |
| O-11 | Demo controls | ops/admin | Business clock (+N days, runs the daily job), demo mode toggle, payout-failure simulation, payment mode (instant / async), role preview switcher, reset demo data. |
| O-12 | Jobs | ops/admin | Manual triggers for every scheduled behaviour: run daily job (batched until done), recalculate liquidity, compute metrics, send outbox, expire checkout holds. Shows the last run per job and warns when today's daily job has not run. Late runs catch up safely. |
| O-13 | Support inbox | ops | Customer care requests by status and topic, with the related deal/order; reply (customer notified in-app) and resolve (F11). |
| O-14 | Audit log | ops | Filterable, paginated view of `ActivityLog` by actor, entity, date range and text; CSV export (F15). |
| O-15 | Mail log | ops | Every email the system would send (simulated in the capstone): recipient, event, subject, body, status. |

## X — Cross-cutting

| Code | Feature | Notes |
| --- | --- | --- |
| X-01 | Authentication | Email + password, OTP verification, password reset, optional MFA (authenticator or SMS), Google/Microsoft/Apple/SSO. |
| X-02 | Role bootstrap | First sign-in with no `app_role` becomes `customer`; builder/admin lands in ops. Written server-side, never client-side. |
| X-03 | Role & mode routing | Landing router: technician → hub, ops → console, customer → last mode or a one-time chooser. |
| X-04 | Notifications | Bell with unread count, list, mark-one/mark-all read, deep links. See `docs/notifications.md`. |
| X-05 | Help / customer care | Topic + optional related record + message (10–1000 chars); creates `SupportRequest` and emails the care inbox (outbox). Ops reads, replies to and resolves requests in O-13; the customer sees replies on `/help`. |
| X-06 | Profile | Name, phone, city, avatar, payout account, delivery address; customers switch mode. Read-only identity for staff. |
| X-07 | Theme | Light/dark with persisted preference; no flash on load. |
| X-08 | Business-date pill | Always-visible current business date so demo ageing is never confusing. |
| X-09 | Empty / loading / error states | Every list and every money surface has all three, with the next action named. |
| X-10 | Status vocabulary | `src/lib/statuses.js` maps every enum to a label and a tone; chips everywhere. |
| X-11 | Money & date formatting | `en-IN` currency grouping, `Asia/Kolkata` dates; one helper per format. |

## Deliberate non-features

No chat between buyer and seller, no seller-set prices, no auctions, no cross-border shipping, no partial-quantity carts (one device = one order), no public seller profiles. Adding any of these breaks the custody guarantee and needs a product decision first.
