 CertiBuy — Automations (jobs & scheduled behaviour)

Everything that happens because **time passed** lives in one place: the daily job. It is a single idempotent endpoint that can be called by a scheduler, by ops from the console, or by the demo clock — the code path is identical, so what you demo is what runs in production.

**Capstone build:** there is no paid scheduler. Every job is **triggered manually from Ops → Jobs** (an optional free daily cron may call it). Because every step acts on records whose dates have passed and checks for existing records first, a run after missed days catches up correctly and never pays twice. Time-critical checks are also enforced at the moment of action (offer expiry at accept, return window at raise, checkout holds on read).

---

## 1. Job inventory

| Job | Cadence | Trigger | Purpose |
| --- | --- | --- | --- |
| `runDailyJobs` | daily (recommended 00:30 IST) | Ops → Jobs (capstone), scheduler (production), demo clock | ladder, ageing, balances, payouts, escrow release, expiry, no-shows, reminders |
| `advanceDemoClock` | on demand | ops (demo mode) | move `sim_day_offset` by N days, then run `runDailyJobs` |
| `recalcLiquidity` | weekly (Mondays) | Ops → Jobs or scheduler | recompute model scores, pause recommendations |
| `computeMetrics` | daily or on open | ops screen / Ops → Jobs | nine metrics × eight weeks |
| `processOutbox` | after each command / on demand | system, Ops → Jobs | deliver queued email (simulated in the capstone) |
| `expireCheckoutHolds` | on demand / on read | Ops → Jobs, listing reads | cancel unpaid `pending` orders past `hold_expires_at`, release the listing |
| `retryPayout` | on demand | ops | one more transfer attempt for a held payout |
| `seedDemoData` | on demand | ops (demo only) | reset the whole demo dataset |

## 2. The business date

```
businessDate = isoDay( now + Settings.sim_day_offset )     // Asia/Kolkata, yyyy-mm-dd
```

Every comparison in the job is between `yyyy-mm-dd` strings. Never mix timestamps into ageing logic. If a body supplies `businessDate`, it is used verbatim (useful for backfills and tests); otherwise it is derived.

## 3. `runDailyJobs` — step by step

Auth: no caller (scheduler) **or** `ops`/`admin`. Any other signed-in user gets `403`.
Body: `{}` (normal run) · `{advanceDays: n}` (demo clock) · `{businessDate: "yyyy-mm-dd"}` (backfill).

### Step 1 — price ladder, reserved days, day-45 review

For each listing:

- **`reserved`** → do not step. Increment `reserved_days` to `max(0, today − paid_at + 1)` so held days never age the price.
- **`active`** → `days_listed = today − listed_at − reserved_days`.
  - ≥ `step2_day` (30) → step 2, price = `max(floor, base × (1 − step2_pct))`, rounded to the nearest ₹10. `floor` is always the listing's `floor_price` = the model's B2B floor price.
  - ≥ `step1_day` (15) → step 1, `base × (1 − step1_pct)`.
  - otherwise base.
  - If an `override_price` is set, **the ladder does not move the price** (the step is still recorded for reporting).
  - On an actual step, write `ladder_step` + `current_price`, log an activity line ("iPhone 13 stepped down 7 % to ₹33,480 (day 15 listed)").
  - ≥ `review_day` (45) → listing `review`, device `day45_review`, notify ops ("Day 45 review: iPhone 13 — listed 52 days and still unsold. Liquidate it to B2B at the floor price, or reprice it."). Liquidation stays a one-click ops decision; the job never liquidates on its own.

### Step 2 — the day-21 balance (Sell For More)

For each device with `payout_option = sell_for_more`, `balance_paid = false`, and a `custody_at`:

- `due_date = custody_at + balance_day (21)`.
- The balance row is normally created as `due` by `completeHandover`. If `today ≥ due_date` and it is still `due`, promote it to `pending` with trigger `day_21_unsold` (this is the whole purpose of the `due` state: the seller sees the promise before it is payable).
- Safety net: if `today ≥ due_date` and no balance payout exists at all, create one (`type:"balance"`, trigger `day_21_unsold`, status `pending`) for `guaranteed_price − advance_paid`.
- A buyer cancellation never resets or reverses the balance.
- Mark `device.balance_paid = true` once handled. Notify the seller when it is actually paid.

### Step 3 — the payout run

Take every payout in `pending` or `approved` and run one attempt through the payout machine (see § 5). Success → `paid`, `paid_at`, seller notified (`balance_paid` ✉ / `payout_paid`). Failure at the limit → `failed`, exception `payment_hold`, seller + ops notified.

### Step 4 — escrow release

For each order `delivered` whose `return_window_closes_at` is in the past, with no open return:

- write `EscrowTransaction(type:"release", amount: total)`;
- order → `settled`, escrow `released`, `settled_at`;
- device → `settled`;
- buyer notified (`escrow_released` ✉).

### Step 5 — offer expiry

Any `active` offer whose `expires_at` day is before today → `expired`. If it was the submission's current offer and the submission was still `draft`/`graded`/`offer_accepted`, the submission → `abandoned` and the seller is told (`deal_abandoned`, and `offer_expiring` was sent before).

### Step 6 — no-shows

Any booking still `booked` whose date is before today → `no_show`.

### Step 7 — reminders (deduped)

Using `alert_window_days` (3):

- `offer_expiring` to sellers whose active offer expires within the window (✉);
- `return_window_closing` to buyers whose window closes within the window (✉).

Dedupe key: `(user_id, event, link)` already present in notifications — a reminder is sent **once**, never nightly.

### Response

```json
{ "ok": true, "businessDate": "2026-11-13",
  "counts": { "stepped": 3, "reviewed": 1, "balances": 1, "payoutsPaid": 2,
              "payoutsFailed": 0, "settled": 4, "expiredOffers": 1,
              "noShows": 0, "reminders": 2 },
  "stepped": [...], "reviewed": [...], "balances": [...], "failedPayouts": [...],
  "settledOrders": [...], "expiredOffers": [...], "noShows": [...], "reminders": [...] }
```

The counts are what the demo screen shows after a clock advance; keep the shape if you reimplement.

## 4. `recalcLiquidity` — the weekly score

For every active model, over the last 8 weeks of sold orders:

```
sales           = per sold unit: days_to_sell, achieved price / market_price_a
demand          = share of views/enquiries (or listings touched) relative to the model's tier
volatility      = stdev(achieved_price / market_price_a) / mean × 100
launch_window   = 1 if successor_launch_date is inside launch_window_days
days_score      = 100 × (review_day − min(avg_days, review_day)) / (review_day − review_day/6)
score           = (liq_w_days/100)·days_score + (liq_w_demand/100)·demand_score
                + (liq_w_volatility/100)·(100 − volatility)
                + (liq_w_launch/100)·launch_score
score          -= liq_review_penalty × day45_returns_for_model
score           = clamp(0..100)

cold start (fewer than 3 measured sales): score = tier_score (high 80 / medium 65 / low 45) − penalty
```

Writes a new `LiquidityScore` (`is_current:false` for all previous rows, `true` for the new one, `source` = `measured` / `cold_start`). Notifies ops when a model crosses the threshold in either direction, and recommends pausing Instant Cash when a model is below threshold with stock on hand (`instant_cash_paused`).

## 5. The payout state machine

```
due ──date reached──▶ pending ──attempt──▶ approved ──▶ paid
                          │
                          └──attempt fails──▶ (retry) … ──at max attempts──▶ failed ──▶ exception + notify
```

One attempt:

```
attempts += 1
if transfer succeeds:
    status = approved   (intermediate write)
    status = paid, paid_at = now, failure_reason = ""
else:
    status = attempts >= payout_max_attempts ? failed : approved
    failure_reason = "Account name mismatch"
    if failed: open exception payment_hold (once), notify seller ✉ and ops
```

The two-write success (`approved` then `paid`) mirrors real rails, where authorisation and settlement are distinct. Keep both writes: reconciliation reads them.

## 6. Demo clock

`advanceDemoClock {days}` (1–30, ops/admin):

1. `sim_day_offset += days` (persisted on `Settings`);
2. run `runDailyJobs` for the new business date;
3. return the new offset and the job summary.

Because the offset is data, not code, every screen that shows "today" moves with it: the business-date pill, the hub day strip, ladder positions, return countdowns, payout due dates. Nothing else in the app needs a demo branch.

`Settings.simulate_payout_failure` makes every attempt fail with "Account name mismatch" — the cheap way to demonstrate the exception queue and the retry path. Turn it off for any real payout run.

## 7. `computeMetrics`

Nine metrics, each as a current value plus eight weekly periods (`PERIODS = 8`):

1. **grade-mismatch rate** — technician grades below the AI band ÷ inspections (target ≤ 15 %, lower is better)
2. **offer-acceptance rate** — offers accepted ÷ offers made (target ≥ 60 %)
3. **Instant Cash share** — devices bought outright ÷ offers accepted (target ≥ 40 %)
4. **median days to sell** — listing to delivery (target ≤ 21 days)
5. **30-day sell-through** — devices listed in a period that sold inside 30 days
6. **devices reaching day 21 unsold** — Sell For More balances paid with the device still owned
7. **inventory ageing beyond the review day** — units past `review_day`
8. **not-as-graded return rate** — returns of that reason ÷ deliveries
9. **cost per successful acquisition** — inspection/hub cost ÷ accepted devices

Every ratio is computed from records; the only configuration reads are `hub_cost` and `review_day`. Each metric carries a target and a direction (`atMost` / `atLeast`), and the headline value is the newest week that recorded anything (the current week is often still filling).

## 8. Scheduling on any stack

| Stack | How |
| --- | --- |
| Capstone (Vercel Hobby + Supabase Free) | manual buttons in Ops → Jobs; work runs in batches (`cursor` / `done`) to fit serverless time limits; optional free daily cron with `CRON_SECRET` |
| Managed platform | scheduled task pointing at the daily endpoint, 00:30 Asia/Kolkata |
| Node + Postgres | `node-cron` / BullMQ repeatable job in a worker process |
| Postgres only | `pg_cron` calling a stored procedure, or `cron` + `curl` to the endpoint |
| Serverless | provider scheduler (EventBridge, Cloud Scheduler) invoking the endpoint |

Whichever you pick:

- protect the endpoint with a **scheduler secret** (header) that is not the user token, and still allow ops to call it with their own token;
- set a **timeout** above the worst case (the job is O(records)); if the dataset grows past ~5 k listings, batch by hub or by listing page and record a `last_run_business_date`;
- make the job **safe to run twice**: every step checks for an existing record before writing money or a reminder;
- alert on a non-200 or on `counts.payoutsFailed > 0` — that is money that did not move.

## 9. Failure handling

| Failure | Behaviour |
| --- | --- |
| Job throws mid-way | earlier steps are already committed; a re-run completes the rest (all steps are idempotent) |
| Mail provider down | notifications still created; email skipped, logged |
| Payout rail down | attempts fail, exception raised at the limit; ops retries after the rail recovers |
| Settings missing | the job returns `400 "Settings are missing."` and writes nothing — a missing configuration must never be interpreted as defaults |
| Two runners at once | last-write wins on the same record but no double money movement (existence checks); still, avoid it with a lock or a single scheduler |

## 10. Manual operations that are *not* automations

Reprice a device, liquidate, resolve a return, retry a payout, pause Instant Cash for a model, collect a mismatch fee, uphold a grade dispute — these are **ops decisions** with an audit trail, deliberately not automated. If you automate one, keep the manual override and log the actor as `system`.
