CertiBuy — Notifications

Two channels, one source of truth: **every event writes a `Notification` record**, and a defined subset is *also* emailed. Email is best-effort — a mail outage never undoes a deal, and the in-app record is what the user can always rely on.

**Capstone build:** in-app notifications are real; email is **simulated**. Each email is written to the `outbox` table and marked sent by the simulated mail adapter, and ops can read every one in Ops → Mail log. Swapping in a real provider changes only the adapter (`docs/architecture.md` §12, §19).

---

## 1. Record shape

```
Notification {
  user_id     recipient
  event       stable machine name (catalogue below)
  title       one line, already user-facing ("Your offer expires in 2 days")
  body        1–2 sentences: what happened and what to do
  link        in-app deep link ("/seller/deals/<id>"), or ""
  read        boolean, default false
}
```

Rules: copy is written as if speaking to the person ("Your payout couldn't be paid"), never mentions internal terms; `title` ≤ 60 chars; `body` ≤ 180; `link` always resolves for that role; one record per (user, event, link) per business day unless the event is genuinely repeatable.

Fan-out helper (single place, so policy is never duplicated):

```
notify(tx, rows[])                   // inside the same transaction as the business change
   ├─ filter rows to those with a user_id
   ├─ bulk insert as unread
   └─ for rows whose event ∈ EMAIL_EVENTS → one outbox row each
processOutbox()                      // after the commit, and from Ops → Jobs
   └─ deliver each outbox row through the mail adapter (best effort; simulated in the capstone)
```

## 2. Event catalogue

| Event | Recipient | Trigger | Email |
| --- | --- | --- | --- |
| `offer_ready` | seller | `gradeSubmission` produced an offer | ✉ |
| `offer_expiring` | seller | daily job, ≤ `alert_window_days` before expiry | ✉ |
| `booking_confirmed` | seller | `bookInspection` | ✉ |
| `booking_cancelled` | seller | reschedule/cancel | — |
| `booking_today` | seller | daily job on the appointment day | — |
| `option_switched` | seller | Instant Cash → guaranteed | — |
| `ic_withdrawn` | seller | Instant Cash became unavailable before acceptance | — |
| `deal_abandoned` | seller | offer expired / seller declined | — |
| `custody_complete` | seller | `completeHandover` (device accepted, payment released) | ✉ |
| `payout_paid` | seller | payout marked paid | — |
| `balance_paid` | seller | balance paid on sale or day 21 | ✉ |
| `payout_failed` | seller | payout attempt failed at the limit | ✉ |
| `payout_hold` | ops | same failure, ops side | — |
| `revised_offer` | seller | inspection one grade below the band; seller must accept or decline | — |
| `price_agreed` | seller | revised offer accepted | — |
| `inspection_rejected` | seller | mismatch / identity reject | ✉ |
| `mismatch_fee` | seller | mismatch fee due or waived | — |
| `grade_dispute` | ops | seller disputes a grade | — |
| `order_placed` | buyer | `placeOrder` (escrow held) | ✉ |
| `order_cancelled` | buyer | `cancelOrder` before dispatch, or an unpaid hold expired (with the refund amount when paid) | ✉ |
| `order_dispatched` | buyer | `advanceShipment` → dispatched/in transit | ✉ |
| `order_delivered` | buyer | `advanceShipment` → delivered | ✉ |
| `return_window_closing` | buyer | daily job, ≤ `alert_window_days` before the window shuts | ✉ |
| `escrow_released` | buyer | window closed, money released to CertiBuy | ✉ |
| `return_raised` | ops | buyer raised a return | — |
| `return_inspection` | ops | technician completed re-inspection | — |
| `return_inspected` | buyer | re-inspection done, awaiting ops decision | — |
| `return_resolved` | buyer | refund/replacement settled | ✉ |
| `listing_live` | ops | device relisted after a return | — |
| `refurb_queue` | ops | faulty return sent to refurbishment | — |
| `day45_review` | ops | daily job, listing reached `review_day` — liquidate to B2B at the floor price, or reprice | — |
| `instant_cash_paused` | ops | liquidity recalc recommends pausing a model | — |
| `exception_open` / `exception_raised` | ops | a new case of any type | — |
| `support_reply` | customer | ops replied to a support request | — |

`EMAIL_EVENTS` (the ✉ set, 14 entries): `offer_ready`, `offer_expiring`, `booking_confirmed`, `custody_complete`, `inspection_rejected`, `balance_paid`, `payout_failed`, `order_placed`, `order_cancelled`, `order_dispatched`, `order_delivered`, `return_window_closing`, `return_resolved`, `escrow_released`.

Everything else is in-app only, by design: it is either low-stakes ("booking cancelled") or staff-facing.

## 3. Email policy

- **One email per event per user.** Subject = `title`. Body = `body` + `` \n\n<app base URL><link> `` + a sign-off. Plain text is fine; HTML must use the app's brand header.
- **The base URL is configuration** (`APP_PUBLIC_URL`), never hardcoded per environment.
- **Only registered/verified addresses.** If a demo account has no address, skip the mail and keep the record.
- **Failures are logged, never fatal**, and visible in Ops → Mail log (closes the "failures not surfaced" gap, audit F14). Never let a mail error change a status or a payout.
- **Auth email** (sign-up confirmation, password reset) is sent by the auth provider, not by `notify()`. In the capstone this is Supabase's built-in, rate-limited email; demo accounts are pre-confirmed and staff invites use a copyable link.
- **No marketing content** in transactional mail; no unsubscribes needed, but the footer should identify the sender and the app.
- **Rate sanity**: a burst of events to one user should collapse where the event is genuinely the same (the daily job dedupes reminders by `(user, event, link)` before sending).

## 4. In-app behaviour

- **Bell** — unread count (server `count`, not a loaded list) + a dropdown of the latest 20 with title, relative time ("2 h ago"), and the link. Opening one marks it read; "Mark all read" is a single bulk update.
- **List page** (`/notifications`) — the same records with a filter for unread, empty state ("You're all caught up"), and pagination.
- **Deep links** are role-safe: a seller link never lands a buyer on a seller page (the route guard bounces with a toast, and the mode switch adjusts).
- **Realtime** — the client may subscribe to its own notification rows to bump the badge without polling; otherwise a 30–60 s refetch of the unread count is enough.
- **Read state** is the only thing a customer may write on this table.

## 5. Customer care (separate from notifications)

The help form is a support channel, not an event feed:

1. Customer picks a topic (`selling_device`, `order_delivery`, `return_refund`, `payments`, `other`), optionally attaches a related deal or order, writes 10–1000 characters.
2. Server creates `SupportRequest` (`status:"open"`, `customer_id` = caller) and emails the care inbox (outbox) with customer name, email, phone, topic, related reference, request id and the message.
3. Ops works the request in **Ops → Support** (closes audit F11): reads it with the related deal/order, writes a reply (stored on the request; the customer gets a `support_reply` notification and sees it on `/help`), and marks it `resolved`.
4. The customer gets an in-app confirmation ("We've got your message — care replies within one working day"), never a promise of a specific resolution.

The care address is configuration (`SUPPORT_EMAIL`), not a constant buried in a component.

## 6. Implementing the fan-out on another stack

In the rebuild, `notify()` lives in `packages/application/notify/` and has two parts:

1. **`notify(tx, rows)`** — called inside the command's transaction. It inserts the `Notification` rows (unread) and, for each row whose event is in `EMAIL_EVENTS` and whose user has an email address, one `outbox` row with the rendered subject (`title`) and body (`body` + `APP_PUBLIC_URL` + `link` + sign-off). Because it shares the transaction, a notification exists if and only if the business change committed.
2. **`processOutbox()`** — runs after the commit and from Ops → Jobs. It hands each pending outbox row to the mail adapter (simulated in the capstone; a real provider later), records `sent` or the failure reason, and never throws back into a command.

Keep this the **only** place that writes notifications and queues transactional mail, so the catalogue above stays honest.