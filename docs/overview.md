CertiBuy — Overview

## 1. What the product is

CertiBuy is a **certified pre-owned device marketplace for India** (phones, laptops, tablets, smartwatches in the **₹20,000 – ₹1,50,000** band) built on one idea: *certified custody*. CertiBuy takes physical possession of every device it sells, inspects and grades it with a technician, refurbishes it, lists it at a transparent grade price with a warranty, and pays the seller either outright or on a guaranteed price.

Because the company holds the device between seller and buyer, four things that are hard in peer-to-peer marketplaces become simple:

- the buyer never meets a stranger's device — it was inspected after handover, in custody, sealed and tagged;
- the seller never waits for a buyer — payment is decided at the counter;
- there is one refund policy, funded from escrow, not from a private seller's goodwill;
- ageing stock has a known cost, so it can be priced down on a schedule.

## 2. Personas

| Persona | Role key | What they do |
| --- | --- | --- |
| Customer — selling | `customer` (`active_mode = seller`) | Values a device, gets an offer, books a hub slot, hands over, tracks payouts |
| Customer — buying | `customer` (`active_mode = buyer`) | Browses graded stock, checks the inspection report, pays into escrow, tracks the order, raises returns |
| Inspection technician | `technician` | Runs the hub queue: identity/IMEI checks, checklist, grade, decision and handover |
| Operations | `ops` | Catalogue, pricing, liquidity, inventory, exceptions, hubs, metrics, demo controls |
| Platform admin | `admin` (platform role) | God-mode for setup and staff management; ops actions are also open to it |

A customer is **one account with two sides**; the same person buys and sells. `active_mode` only decides which side of the app opens first.

## 3. The seller journey (8 steps)

1. **Device** — pick brand → model → storage → colour from the catalogue. Only models inside the price band are selectable; others are shown disabled with the reason.
2. **Details** — condition, repair history, water exposure, accessories, warranty status, age; the IMEI is validated (15 digits + Luhn check) before anything else runs.
3. **Photos** — 8 guided shots for phones (5 for other categories), each checked in the browser for minimum resolution and brightness, retakes counted.
4. **Diagnostics** — 9 checks plus battery health; activation lock must be off.
5. **Result** — the grading engine turns battery/cosmetic/function signals into an **estimate**, a **band** and a **confidence**. Five conditions reject the deal outright (blacklisted IMEI, activation lock on, water exposure, third-party repair, invalid IMEI).
6. **Offer** — two prices: **Sell For More** (guaranteed, always offered) and **Instant Cash** (only when the model's liquidity score, launch window, stock caps and confidence allow). The offer shows the full breakdown and expires in 7 days.
7. **Confirm** — explicit consent to the terms, choose the payout option.
8. **Hub** — pick a hub, a day within the next five and a slot. The seller is told what to bring and what happens at the counter.

After handover the deal continues in **Track deal**: status, payments, booking, timeline, and the "Sell For More money progress" tracker.

## 4. The counter (technician) journey

1. **Identity** — scan/enter the IMEI, confirm activation lock is off; blacklist lookup; mismatch is a hard stop.
2. **Checklist** — 9 pass/fail items, battery health, cosmetic grade; three component grades (battery, cosmetic, functions) collapse to the **worst** = confirmed grade.
3. **Grade** — the confirmed grade is compared with the AI band:
   - **inside** → the quoted price stands;
   - **one below** → a **revised offer** is generated at the confirmed grade;
   - **two or more below** → **mismatch**: collect the mismatch fee (`mismatch_fee`, ₹100), reject, return the device.
4. **Decision** — the seller accepts or declines the revised price at the counter.
5. **Handover** — seal in a tamper-evident bag, scan the custody tag (`CB-#####`), capture the seller's signature, record the payment. Only now does the device become inventory. Grades A–C are listed straight away; grade D goes to refurbishment first and is listed afterwards with no warranty.

## 5. The buyer journey

Browse (filters: category, brand, model, grade, price, storage, warranty, search) → listing page (grade strip, battery, warranty, full inspection report, hub, price history) → checkout (delivery details, payment method, optional second-year warranty add-on) → **escrow hold** → dispatch → in transit → delivered → 7-day return window (starting at delivery) → escrow released to CertiBuy.

**Cancelling before dispatch.** Until the order is dispatched, the buyer can cancel it and gets a **full refund** (`total − cancel_fee`; the fee is ₹0 by default). The device goes back on the shelf with its ladder position kept. A cancellation never takes back money already promised or paid to the seller.

Returns are one of three reasons with predetermined outcomes:

| Reason | Allowed outcomes | Money |
| --- | --- | --- |
| Not as graded | faulty · as shipped | faulty = full refund; as shipped = refund less ₹300 logistics |
| Dead on arrival | DOA confirmed · replacement · as shipped | confirmed = full refund or a replacement unit; as shipped = less ₹300 |
| Buyer changed his/her mind | changed mind | refund less ₹500 |

A returned-but-healthy device goes back on the shelf at its grade price, day 0 of the ladder. A faulty one goes to refurbishment.

The ₹500 is a **return** deduction only; it never applies to a pre-dispatch cancellation. There is no seller-side cancellation fee (audit F8, unchanged).

## 6. Money model (all values from `Settings`)

**What a seller is offered** — market price of the grade band, minus commission, minus the inspection fee:

```
market   = gradePrice(model, grade)                    // grade B/C/D fall back to A × factor
guaranteed (Sell For More) = round(market × (1 − commission_pct/100) − inspection_fee)
instant cash                = round(market × (1 − commission_pct/100) − inspection_fee − risk)
risk                        = market × risk_pct/100      // 5 % fast-selling, 12 % otherwise
```

Defaults: commission 15 %, inspection fee ₹200, grade factors B 0.91 / C 0.82 / D 0.60.

**When a seller is paid**

| Option | At handover | Later |
| --- | --- | --- |
| Instant Cash | 100 % of the instant cash amount | — |
| Sell For More | 50 % advance of the guaranteed price | Balance when the buyer pays, or on **day 21** unsold, whichever comes first |

Payout records are the ledger: `type` ∈ `instant_cash_full · advance · balance · mismatch_fee`, `status` ∈ `pending · approved · paid · failed · due`. For Sell For More, the balance is recorded as `due` at handover so the seller sees the promise; it becomes `pending` when the buyer pays or on its day-21 business date.

**What a buyer pays** — listing ask price (or an ops override) + optional second-year warranty (`warranty_addon_pct`, 5 % of price; never on grade D). Grade D is not listed at handover: the device is refurbished first, then listed with **no warranty** (and therefore no add-on).

**The floor price** — one definition: the model's B2B floor price (`b2b_floor_price`), copied onto every listing. It is the price below which the ladder never sells, and the price at which a device is liquidated to a B2B buyer after the day-45 review.

**The price ladder** — a listing starts at its grade price and steps down on a schedule, never below the floor price:

| Business day listed | Step | Price |
| --- | --- | --- |
| 0–14 | 0 | base |
| 15–29 | 1 | base × (1 − 7 %) |
| 30–44 | 2 | base × (1 − 12 %) |
| 45+ | review | B2B liquidation at the floor price (one-click ops action), or ops reprices |

Reserved days (a device held for a paid buyer) do **not** count towards the ladder.

**Escrow** — the buyer's money is held until the return window closes (`return_window_days`, 7, counted from delivery). Then an `EscrowTransaction` of type `release` closes the order and the device is marked settled. A pre-dispatch cancellation or a resolved return instead writes a `refund_full` / `refund_partial` row.

## 7. Business date

Every time-based rule uses the **business date**: `real date + Settings.sim_day_offset`, in `Asia/Kolkata`, as `yyyy-mm-dd`. Ops can move the clock (demo) or run the daily job from Ops → Jobs (in the capstone, jobs are triggered manually; a late run catches up); both run the same code path. This is why the app can demonstrate six weeks of ageing in a click without mocking dates in the UI.

## 8. Supporting surfaces

- **Notifications** — in-app records for every event, email for the 14 transactional ones (simulated in the capstone, visible in Ops → Mail log).
- **Help / customer care** — a topic-based form that creates a `SupportRequest` and emails the care inbox; ops reads, replies to and resolves it in Ops → Support.
- **Profile** — identity, phone, city, avatar, payout account, delivery address; customers also switch buying/selling here.
- **Ops console** — overview KPIs, alerts, catalogue, pricing, liquidity, inventory, exceptions, hubs, users (with staff invitations), metrics, jobs, support, audit log, mail log, demo.
- **Metrics** — nine operating metrics with eight weeks of history: grade-mismatch rate, offer-acceptance rate, Instant Cash share, median days to sell, 30-day sell-through, devices reaching day 21 unsold, inventory ageing beyond the review day, not-as-graded return rate, cost per successful acquisition.

## 9. What is simulated in the capstone build

CertiBuy is initially a zero-budget capstone demonstration (`docs/architecture.md`). These effects are **simulated** behind adapters, so a real provider can be plugged in later without changing any business rule:

- **Payment capture** — checkout authorises, it never charges; a "simulate a declined payment" switch proves nothing is written on refusal.
- **Refunds** (returns and cancellations) — the escrow ledger is real; no money moves.
- **Payout rail** — the ledger and retry machine are real; the transfer is not. Failures only occur when the demo switch is on.
- **Courier** — no AWB, no webhook; shipment states are advanced by ops (or by the buyer in demo mode).
- **Grading model** — a deterministic rule engine, not vision/image analysis.
- **Diagnostics** — seller-declared answers.
- **IMEI registry** — a local blacklist table.
- **Notification email** — written to an outbox and shown in Ops → Mail log, not delivered.

Not built, by decision: a seller-side cancellation fee (audit F8). Delivered since the audit: buyer cancellation before dispatch (F7), grade-D listing with no warranty (F9), a single floor price (F10), the support inbox (F11), staff invitations (F12), the audit viewer (F15) and the user return counter (F16).

Deliberately out of scope as product: multi-country operation, multiple currencies, any time zone other than `Asia/Kolkata`.