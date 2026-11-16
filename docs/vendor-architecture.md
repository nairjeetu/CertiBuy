CertiBuy — System & Vendor Architecture

This document describes the system as boxes, state machines and money ledgers, so it can be rebuilt on any stack and so every external dependency is an explicit, replaceable seam. The concrete rebuild stack (Next.js on Vercel Hobby, Supabase Free, every money seam simulated) is in `docs/architecture.md`.

---

## 1. Architecture in one picture

```
             ┌─────────────────────────────────────────────────────────────┐
             │                        Web app (SPA/SSR)                    │
             │  seller wizard · shop · hub console · ops console · profile │
             └───────────────┬───────────────────────────┬─────────────────┘
                             │  read models (GET)        │  commands (POST)
                             ▼                           ▼
             ┌─────────────────────────────────────────────────────────────┐
             │                     Application server                      │
             │  ① read models ② commands ③ jobs ④ guards & projections     │
             │  domain modules: pricing · offer · inspection · lifecycle   │
             │                  custody · returns                          │
             └──────┬──────────────┬───────────────┬──────────────┬────────┘
                    │              │               │              │
             ┌──────▼─────┐ ┌──────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
             │  Database  │ │  File store │ │  Mail/notify│ │  Payment &  │
             │ 21 tables  │ │ photos, sigs│ │  provider   │ │ payout rail │
             └────────────┘ └─────────────┘ └─────────────┘ └────────────┘
                    ▲
             ┌──────┴──────┐   ┌──────────────┐   ┌──────────────┐
             │ Cron/daily  │   │ AI/vision    │   │ Hub partners │
             │ job runner  │   │ (optional)   │   │ (physical)   │
             └─────────────┘   └──────────────┘   └──────────────┘
```

Three rules of thumb:

1. **The server owns every number.** The client sends ids and intents; the server re-reads records, recomputes, and writes.
2. **Domain logic is one module deep.** Pricing, offer, inspection, lifecycle, custody and returns are pure functions shared by commands, jobs and (mirrored for display only) the UI.
3. **Every external service is behind an interface** — payment capture, payout transfer, courier tracking, IMEI/blacklist registry, photo/vision analysis, mail. Swapping a vendor must not touch domain modules.

## 2. Module map

| Module | Responsibility | Reference location | Pure? |
| --- | --- | --- | --- |
| Pricing engine | grade prices, business date, launch window, liquidity score, IC eligibility | `shared/pricing.ts` | mostly (reads Settings/model/score) |
| Offer builder | band → offer record (guaranteed + instant cash + risk + breakdown + expiry) | `shared/offer.ts` | no (writes Offer) |
| Inspection rules | checklist → component grades → final grade; band verdict; price at grade; hub access; notification helper | `shared/inspection.ts` | mostly |
| Lifecycle | price ladder, payout state machine, payout attempts/failure, Indian money format | `shared/lifecycle.ts` | yes |
| Custody | payout plan (advance/balance), listing price, order pricing | `shared/custody.ts` | yes |
| Returns | reason/outcome matrix, raise maths, resolution maths, relisting | `shared/returns.ts` | mostly |
| Commands | 25 endpoints (see `docs/api.md`) | `functions/<name>/` | no |
| Read models | per-audience projections for each screen | `lib/*-fns.js` | no |
| Jobs | daily ageing/expiry/payout run, liquidity recalc, metrics, demo clock, demo seed | `functions/runDailyJobs` etc. | no |

## 3. The domain in state machines

### 3.1 Submission (seller → counter)

```
draft ──grade──▶ graded ──accept offer──▶ offer_accepted ──book──▶ scheduled
                    │                                                  │
                    │                                            inspected
                    │                                                  │
              (offer expires)                                   ┌──────┴───────┐
                    │                                        accept          decline
                    ▼                                             │              │
               abandoned ◀──────────── decline ◀── revised offer  accepted     abandoned
                                                                  │
                                                             handover ▶ Device created

any ──hard reject (identity/mismatch/unsafe)──▶ rejected
```

Rules: only one active offer per submission (`current_offer_id`); `scheduled` requires an accepted offer and a booked slot; `accepted` requires a confirmed (sealed) inspection report; `rejected` cancels the live booking.

### 3.2 Device (inventory unit) & Listing

```
in_refurbishment ─▶ listed ⇄ reserved ─▶ shipped ─▶ delivered ─▶ settled
        ▲                │                                  │
        │                └──(day 45 review) day45_review    └─(return) returned
        └───────────────────────────── refurb / relist ◀──────┘
                       liquidated  (sold to a B2B buyer at floor)
```

A **`Device`** is the physical unit (IMEI, tag, colour, grade, acquisition cost, custody hub). A **`Listing`** is its offer to the market (base/current/floor price, ladder step, reserved days, warranty months, status). One device has at most one live listing.

- Grade D enters at `in_refurbishment` (no listing at handover); "refurb / relist" lists it with `warranty_months = 0`.
- `floor_price` is always the model's B2B floor price; `liquidated` is the B2B sale at that price, chosen by ops after the day-45 review.
- A cancelled order moves `reserved → listed` (listing back to `active`, reserved days kept).

### 3.3 Order & escrow

```
pending ─▶ paid ─▶ dispatched ─▶ in_transit ─▶ delivered ─▶ settled
   │         │                                  │
   └─────────┴─▶ cancelled (before dispatch)    ├─ refunded  (return)
                                                └─ replaced  (DOA replacement)

escrow: hold ─▶ released                     hold ─▶ refunded_full / refunded_partial
                                              replacement: held_replacement
```

- `pending` exists only while an (async) payment is awaited; an unpaid hold past `checkout_hold_minutes` becomes `cancelled`.
- `paid → cancelled` is the buyer's pre-dispatch cancellation: escrow `refund_full` for `total − cancel_fee` (fee 0 by default, so a full refund). Seller payouts are never reversed.
- The return window starts at **delivery**: `return_window_closes_at = delivered_at + return_window_days`.

### 3.4 Return

```
awaiting_reinspection ──tech re-inspects──▶ awaiting_decision ──ops resolves──▶ resolved
```

Outcome must be one the reason allows:

| Reason | Outcomes | Deduction | Escrow movement |
| --- | --- | --- | --- |
| `not_as_graded` | `faulty`, `as_shipped` | 0 / ₹300 | full / partial refund |
| `dead_on_arrival` | `doa_confirmed`, `doa_replacement`, `as_shipped` | 0 / 0 / ₹300 | full refund / replacement (escrow held) / partial refund |
| `buyer_changed_mind` | `changed_mind` | ₹500 | partial refund |

A healthy device is relisted at its grade price, day 0. A faulty one goes to `in_refurbishment`.

### 3.5 Payout

```
due ──(business date reached)──▶ pending ──attempt──▶ approved ──▶ paid
                                             │
                                             └──attempt fails──▶ failed ──ops retry──▶ paid
```

Attempts are counted; at `payout_max_attempts` (3) an exception case `payment_hold` is opened and the seller + ops are notified. A `due` record exists so the seller can see the promise before it becomes payable.

## 4. Money & trust ledgers

| Ledger | Table | What it proves |
| --- | --- | --- |
| Buyer money | `EscrowTransaction` (`hold`, `release`, `refund_full`, `refund_partial`) | every movement of a buyer's rupee, with the reason in `note` |
| Seller money | `Payout` (`instant_cash_full`, `advance`, `balance`, `mismatch_fee`) | every rupee owed and paid, with attempts and failure reason |
| Operations audit | `ActivityLog` | human-readable timeline entries with actor, entity and business date |
| Notifications | `Notification` | what the user was told, and when, with a deep link |

Invariants: payouts never exceed the guaranteed price; for every order, the `hold` equals its `total`, and the closing movements (`release`, or a refund plus any retained fee/deduction) account for that `total` exactly; a `balance` payout is created once per device; an escrow `release` or refund happens at most once per order.

## 5. Vendor seams (replace without touching domain logic)

| Seam | Reference behaviour | Interface to implement | Notes for a real vendor |
| --- | --- | --- | --- |
| **Payment capture** | simulated authorisation; `declined: true` returns a decline and writes nothing | `POST /payments/authorize {orderId, amount, method} → {status, reference}` | Use Stripe/Razorpay; keep escrow as an internal ledger, authorise + capture later, or capture immediately and hold a refundable balance. Never trust an amount from the client. |
| **Payout rail** | simulated transfer; `Settings.simulate_payout_failure` makes attempts fail with "Account name mismatch" | `POST /payouts/transfer {payoutId, amount, accountRef} → {status, reference, failureReason}` | UPI/IMPS/bank API. Verify the payee name (penny drop) before marking paid; treat `pending`/`processing` as an async state. |
| **Courier / logistics** | ops or demo advances shipment states | `advanceShipment` → `paid→dispatched→in_transit→delivered`; webhook maps courier events to those states | Shiprocket/Delhivery webhook: map statuses, never invent a `delivered` without the courier's proof. |
| **IMEI / blacklist registry** | `BlacklistedImei` table looked up by exact IMEI | `lookupImei(imei) → {blacklisted, reason}` | Keep the table as a cache of a registry; re-check at handover, not only at submission. |
| **AI / vision analysis** | deterministic grading engine (see `docs/ai-integration.md`) | `assess(submission, photos) → {estimate, band, confidence, factors}` | Any model is fine as long as it returns that shape and never a price. |
| **Messaging (mail/SMS)** | transactional email for 14 events (queued in an outbox; delivery simulated in the capstone); in-app records for all | `notify(tx, rows[])` + outbox + `sendEmail({to, subject, body})` | Email failures are logged, never fatal. SMS/WhatsApp is additive. |
| **File storage** | private bucket for seller photos, inspection photos, signatures; public URLs for catalogue images | `uploadPrivate`, `uploadPublic`, `signedUrl` | Seller/inspection media is personal data: private + signed, short TTL. |
| **Hubs (physical partners)** | `Hub` records with slots and daily capacity; technician scoped by `hub_id` | same table | Partner hubs are a vendor relationship, not a code path: type `partner` vs `flagship` only affects copy and copy-level trust. |

## 6. Event flow — from submission to money

```
Seller submits ──▶ gradeSubmission ──▶ GradeAssessment + Offer + notification(offer_ready, ✉)
                                                        │
Seller accepts ──▶ acceptOffer ──▶ bookInspection ──▶ Booking + notification(booking_confirmed, ✉)
                                                        │
Hub: verifyIdentity ─▶ confirmGrade ──▶ InspectionReport(sealed) + submission(inspected)
        │                                   │
        │                          inside ──┴── one below ──▶ reviseOffer ──▶ accept/decline
        │                                                   └── two below ─▶ rejectForMismatch ─▶ Exception + fee payout
        ▼
completeHandover ──▶ Device + Payout(instant_cash_full | advance) + Listing + notifications(custody_complete ✉)
        │
Daily job ──▶ ladder steps (day 15/30) ──▶ day 45 review ──▶ balance on day 21 (Sell For More)
        │
Buyer: placeOrder ──▶ Order(paid) + EscrowTransaction(hold) + Listing(reserved) + balance payout if S4M
        │
advanceShipment ──▶ dispatched ──▶ in_transit ──▶ delivered (+ ✉)
        │
Buyer: raiseReturn ──▶ ReturnRequest + Exception + notification(return_raised)
        │
Technician: returnInspection ──▶ report(return) ──▶ awaiting_decision
        │
Ops: resolveReturn ──▶ escrow refund/replacement ──▶ relist or refurbish ──▶ notifications(return_resolved ✉)
```

## 7. Scheduling & time

- One **daily job** owns all ageing: ladder, reserved days, day-45 review, day-21 balance, payout run, escrow release, offer expiry, no-shows, reminders.
- One **weekly job** recomputes liquidity scores (and can run the metrics snapshot).
- One **demo clock** endpoint moves `sim_day_offset` and immediately runs the daily job, so the UI can demonstrate time without changing any rule.
- All jobs are idempotent per business date: they only act on records whose dates have passed, and they check for an existing record before creating a money movement or a reminder.

## 8. Security model

| Concern | Control |
| --- | --- |
| Authentication | platform auth (email + OTP, reset, MFA, OAuth/SSO) |
| Authorisation | route guard (UX) + server re-check + record access rules (authority) |
| Price tampering | every amount derived server-side from records |
| Data leakage | per-audience read models; seller/buyer/cost/floor never in one payload |
| Personal data | seller photos, signatures, addresses and phone numbers live in private storage / restricted columns; only ops and the owner read them |
| Operator abuse | staff scoped by hub; ops actions logged in `ActivityLog`; money actions are explicit and idempotent |
| Secrets | payment/payout/courier keys are server-side environment secrets, never in the client bundle |
| Auditability | `ActivityLog` + `EscrowTransaction` + `Payout` + `InspectionReport` are append-mostly and immutable-by-policy |

## 9. Portability notes

The reference implementation runs the web app on TanStack Start (SSR) and the backend as server functions plus a managed entity store with per-record access rules. Equivalent targets, with no domain change:

| Reference piece | Drop-in alternative |
| --- | --- |
| Entity store + record rules | Postgres (tables as in `docs/database.md`, rules as RLS policies) |
| Server functions | Express/Fastify/NestJS handlers, Next.js route handlers, or Lambdas |
| Storage + signed URLs | S3/R2 + presigned URLs |
| Cron | `pg_cron`, a scheduler, or a platform cron hitting one endpoint with a shared secret |
| Mail | Resend/SES/Postmark |

Keep the **contract**, not the vendor: the same commands, the same projections, the same pure domain modules.
