# CertiBuy Demo Walkthrough

Step-by-step guide for demonstrating the full custody-first device marketplace.

## Demo accounts

| Email | Password | Role |
|---|---|---|
| admin@certibuy.demo | Demo1234! | Ops (platform admin) |
| tech@certibuy.demo | Demo1234! | Hub technician |
| seller@certibuy.demo | Demo1234! | Customer (seller mode) |
| buyer@certibuy.demo | Demo1234! | Customer (buyer mode) |

All accounts use the same password: `Demo1234!`

---

## 1. Seller flow

**Login as:** seller@certibuy.demo

1. Land on **Seller Dashboard** (`/seller`)
2. Click **Sell a device** → `/seller/submit`
3. Select a device model (e.g. iPhone 14, 128 GB)
4. Fill in IMEI — it must be 15 digits **and pass the Luhn check**, e.g. `490154203237518`
   or `359222383208706`. An invalid number keeps the *Next: Photos* button disabled, so a
   typo is caught here rather than after the photos are uploaded.
5. Save → proceed to **Diagnostics** step
6. Run through each diagnostic check (battery, screen, speakers, etc.)
7. Save → proceed to **Photos** step
8. Upload device photos (front, back, screen)
9. Submit → system auto-grades and computes an **Offer**
10. View the offer: **Instant Cash** (if eligible) or **Sell For More**
11. Accept the offer → choose a payout option
12. Book a hub inspection slot — **pick Indiranagar**, pick a date + time.
    `tech@certibuy.demo` (Ravi Kumar) is assigned to Indiranagar and a technician only sees
    their own hub's queue, so a booking at Koramangala will not appear in step 2.
    Times already past are not offered for today.
13. Submission moves to `scheduled` status

**What to show:** The offer computation, IC eligibility check, the two pricing options.

---

## 2. Hub flow

**Login as:** tech@certibuy.demo

1. Land on **Hub Dashboard** (`/hub`)
2. See today's queue of scheduled inspections
3. Click on the scheduled submission
4. **Verify identity** — enter scanned IMEI, confirm activation lock is off
5. **Confirm grade** — fill the inspection checklist (each component pass/fail), set battery health %, cosmetic grade, upload inspection photos
6. Grade result:
   - **Within band** → proceed to handover
   - **One grade below** → system shows revised offer, seller accepts or declines
   - **Two+ grades below** → mismatch, device returned with fee
7. **Complete handover** — assign tag ID (format `CB-00001`), mark sealed, capture signature
8. Device moves to `listed` status, Listing created, Payout initiated

**What to show:** The grading logic, mismatch handling, the handover-to-listing transition.

---

## 3. Buyer flow

**Login as:** buyer@certibuy.demo

1. Land on **Shop Home** (`/shop`) — see listed devices with photos, grades, prices
2. Click **Browse all** → `/shop/browse` — filter by brand, grade, storage, sort by price
3. Click a listing card → **Listing detail** page with grade strip, inspection report, warranty info
4. Click **Buy** → **Checkout** page
5. Fill delivery details (pre-filled from profile), select payment method
6. Place order → **Confirmation** page with order ID
7. Navigate to **My orders** (`/shop/orders`) → see the order with status
8. Click order → **Order tracking** with shipment timeline, return window countdown

**What to show:** The escrow model (money held until return window closes), the grade explanation page.

---

## 4. Ops flow

**Login as:** admin@certibuy.demo

1. Land on **Ops Overview** (`/ops`) — KPIs: active listings, pending payouts, open exceptions, today's bookings
2. **Inventory** (`/ops/inventory`) — all devices with status, grade, prices. Click a row for detail panel with actions:
   - For `in_refurbishment` devices: "Mark refurbished and list"
   - For `day45_review` devices: "Liquidate to B2B" or "Reprice"
   - For `listed` devices: "Reprice" or "Set override price"
3. **Catalogue** (`/ops/catalogue`) — all device models, IC pause toggle
4. **Exceptions** (`/ops/exceptions`) — grade mismatches, payout failures. Resolve each.
5. **Jobs** (`/ops/jobs`) — run daily jobs manually, view job history

**What to show:** The settings panel (all configurable, nothing hardcoded), the alert system.

---

## 5. Lifecycle demo (advance time)

This demonstrates the full money path with time progression.

1. **As ops**, go to **Demo** (`/ops/demo`)
2. Note the current business date
3. Click **Advance clock +1 day** — runs the daily job:
   - Payouts attempt processing
   - SFM balance payouts check on day 21
   - Checkout holds expire after 15 min
4. Advance **+15 days** — triggers **price ladder step 1** (prices drop by step1_pct)
5. Advance **+15 more days** — triggers **step 2** price drop
6. Advance **+15 more days** — triggers **day-45 review**
7. Go to **Alerts** (`/ops/exceptions`) → see day-45 review devices
8. Choose: **Liquidate to B2B** at floor price, or **Reprice** to put back on sale

**What to show:** Business date vs real date, the ladder stepping down prices, the day-45 review trigger.

---

## 6. Edge cases

### Payout failure
1. As ops, go to Demo → toggle **Simulate payout failure** ON
2. As seller, complete a handover (or advance clock to trigger a payout)
3. Payout lands in `failed` status → appears in Exceptions
4. Toggle failure OFF → advance clock → payout retries and succeeds

### Return flow
1. As buyer, go to an order that's been delivered (advance clock past delivery if needed)
2. Click **Request return** → select reason (not as graded, DOA, changed mind)
3. As ops, go to Exceptions → see the return request
4. Resolve with appropriate outcome (faulty → refurbishment, as shipped → relist)

### Grade mismatch
1. As hub tech, confirm a grade 2+ levels below what the seller declared
2. System triggers mismatch → device returned, mismatch fee applied
3. Seller sees the mismatch on their dashboard

---

## Tips

- All prices come from Settings — change them in Ops → Pricing to see immediate effect
- The demo clock only moves forward — no going back
- Each account is both buyer and seller — switch mode in profile if needed
- The shop shows devices seeded during setup + any created through the seller/hub flow
