 CertiBuy — AI & Automated Grading

## 1. The principle

The grading engine answers one question: **how good is this device, and how sure are we?** It returns an *estimate*, a *band* and a *confidence*. It **never returns a price** — pricing is a pure function of the model's market prices and `Settings` (see `docs/overview.md` § 6). This separation is what makes the system auditable: any change in an offer can be traced to a catalogue price or a Settings value, never to a model's mood.

The reference build implements the engine **deterministically** (rules over declared answers, diagnostics and photo-quality signals). That is a feature, not a placeholder: it is reproducible, testable, free and explainable to a seller. A vision/LLM model can replace or augment it behind the same interface — see § 6.

## 2. Inputs

| Source | Signal |
| --- | --- |
| Submission | declared cosmetic grade (A–D), repair history, water exposure, age band, accessories, warranty status, IMEI |
| Diagnostics | 9 pass/fail checks (battery, screen/touch, speakers, microphone, cameras, charging, sensors, IMEI/blacklist, activation lock) + battery health % |
| Photos | 8 shots for phones / 5 for other categories; each carries a browser-computed brightness and a pass/fail on resolution |
| Metadata | `retake_count` (how many photos the seller had to redo) |
| Registry | `BlacklistedImei` lookup |
| Settings | battery floors, photo limits, retake threshold |

## 3. Hard rejects (before any grading)

Checked in this order; the first hit ends the submission with `status: "rejected"` and a seller-readable `reject_reason`.

| Code | Condition | Copy shown |
| --- | --- | --- |
| `blacklisted_imei` | IMEI in the registry | "This IMEI has been reported blacklisted, so we can't buy this device." |
| `activation_lock` | `diagnostics.activation_lock === "on"` | "Activation lock is still on. Turn it off on the device, then run the checks again." |
| `water_exposure` | declared water exposure | "Devices that have been exposed to water can't be bought, even after a repair." |
| `other_shop_repair` | repaired at a non-authorised shop | "Repairs at a shop other than an authorised service centre can't be accepted." |
| `invalid_imei` | not 15 digits or Luhn fails | "That IMEI isn't valid. Check the 15 digits on the device or its box and enter them again." |

An IMEI is validated twice: in the browser for instant feedback, and again on the server before grading, because the browser is not a trust boundary.

## 4. Estimating the grade

Three component signals, worst wins:

```
battery_grade    = A if health ≥ battery_a_min, B if ≥ battery_b_min, C if ≥ battery_c_min, else D
cosmetic_grade   = the seller's declared grade (A–D; default B if invalid)
function_grade   = A when every check passes, otherwise D
estimate         = worst(battery_grade, cosmetic_grade, function_grade)
```

(The technician's confirmation is stricter — one, two, ≥ three failed checks map to B, C, D respectively. Deliberate asymmetry: the automated read is a *quote-quality* signal, the technician's is the *contractual* grade.)

## 5. Confidence and band

```
confidence = "Low"     if repair history is "not_sure"
             "Medium"  if retake_count > photo_retake_medium
             "High"    otherwise
```

```
Low    → band = [oneBetter(estimate), estimate, oneWorse(estimate)]   // three grades wide
estimate A → band = ["A","B"]
estimate D → band = ["C","D"]
otherwise  → band = [oneBetter(estimate), estimate]
```

The band is the promise: if the technician's grade lands inside it, the quoted price stands. The width is the honest uncertainty — a seller who was unsure about repairs gets a wider band and a lower confidence, which also blocks Instant Cash (it needs `confidence ≠ Low`).

Each assessment stores a numeric `confidence` (90 / 70 / 45) for display and analytics, plus a `factors` list explaining every component in seller language ("Battery health 92 % → grade A", "Photos retaken 3 times → confidence Medium").

## 6. Swapping in a model (vision / LLM)

The interface to implement:

```ts
assess(input: {
  submission,                  // declared answers + diagnostics
  photos: {key, url, brightness, ok}[],
  settings,                    // battery floors, retake threshold
}): Promise<{
  estimate: "A"|"B"|"C"|"D",
  band: ("A"|"B"|"C"|"D")[],
  confidence: "High"|"Medium"|"Low",
  factors: string[],           // 1–5 short, seller-readable lines
}>
```

Rules for any implementation:

1. **No price, no fee, no payout.** If the model emits a number in rupees, it is discarded.
2. **Never widen a band silently.** A model that is unsure must lower confidence, not invent a wider promise.
3. **Deterministic post-processing.** Clamp the band to allowed shapes (1–3 grades, contiguous, worst ≥ estimate−1), validate enums, reject anything else and fall back to the deterministic engine.
4. **Explain.** `factors` are shown to the seller; they must be true statements about the inputs, not model prose about itself.
5. **Media privacy.** Seller photos are personal data: send them through a short-lived signed URL, do not persist them at the provider, and never log URLs.
6. **Cost and latency.** Grading blocks a seller mid-flow: set a timeout (≤ 8 s), fall back to deterministic on timeout, and cap images per call (8).
7. **Coverage.** Run the model on the whole band of the catalogue, including cheap and old models where photos are dark and damage is subtle — those are exactly where it earns its keep.

### Server-side adapter

Call the provider from **server code only**, after authenticating the caller, and keep the credential in a server-side environment secret. Any OpenAI-compatible endpoint works (OpenAI, Azure, Groq, Together, or a self-hosted gateway); the reference repository also ships `src/lib/ai.server.js`, a small adapter that binds an OpenAI-compatible client to a configured base URL and key so the model can be switched without touching the grader.

```ts
// server only — never bundled into the client
const reply = await fetch(`${AI_BASE_URL}/chat/completions`, {
  method: "POST",
  headers: { "content-type": "application/json", authorization: `Bearer ${AI_API_KEY}` },
  body: JSON.stringify({
    model: "gpt-4o-mini",                                  // or a vision-capable model
    response_format: { type: "json_object" },              // ask for strict JSON…
    messages: [{ role: "user", content: prompt }],
  }),
});
const raw = await reply.json();
const assessment = AssessmentSchema.parse(JSON.parse(raw.choices[0].message.content)); // …then validate
```

Whatever the provider, the shape returned to the caller is `{estimate, band, confidence, factors}` — the same shape the deterministic engine returns, so nothing downstream changes.

### Prompt sketch (if you do use a model)

```
You are grading a used phone for a refurbished marketplace in India.
You do not set prices. You do not negotiate.
Return JSON: { estimate: "A|B|C|D", band: [grades], confidence: "High|Medium|Low",
               factors: [string] }.
Rules: estimate is the worst of battery health, cosmetic condition and functional
checks. Band is at most three contiguous grades around the estimate; A floors to
[A,B]; D floors to [C,D]. Confidence drops to Medium when photos had to be
retaken, Low when repair history is unknown. Factors must cite the input that
caused each grade. If an image is unusable, say so in factors and lower
confidence — never guess damage from a dark photo.
Inputs: <declared answers as JSON>, <diagnostics as JSON>, <photo URLs>.
```

Validate the JSON against a schema. On any violation, use the deterministic result.

## 7. What the technician does with it

The technician's confirmed grade is compared with the AI band:

| Verdict | Meaning | Next step |
| --- | --- | --- |
| `inside` | grade within the quoted band | quoted price stands |
| `one_below` | exactly one grade below the band | generate a revised offer at the confirmed grade |
| `two_below` | two or more below | mismatch: collect the inspection fee, reject, return the device |

This is the mechanism that keeps automated grading honest: the promise is a band, the technician narrows it, and the seller decides at the counter with the revised number in front of them.

## 8. Photo quality (browser-side, before upload)

`checkPhoto(file, {minPx, minBrightness})`:

- decode the image, reject if its shorter side is under `photo_min_px` (600 px) with the actual size in the message;
- downscale to 48 × 48 on a canvas and compute mean luminance (Rec. 601 weights); reject under `photo_min_brightness` (60) with "Too dark. Move closer to a window or switch on a light, then retake.";
- return `{ok, brightness}` — the brightness is stored with the photo and feeds confidence.

Nothing is uploaded for grading; the check runs on the device. Retakes increment `retake_count`, which is the confidence signal.

## 9. Liquidity scoring (the other "intelligence")

Not a model, but the second automated judgement in the product: `scoreModel` weighs days-to-sell (40), demand (25), volatility (20) and launch window (15) from Settings, cold-starts from the model's tier (80/65/45) until three sales exist, and subtracts a penalty per day-45 return. The score gates Instant Cash (threshold, tightened by 10 points inside a launch window) and classifies risk (5 % fast-selling vs 12 % steady). Details in `docs/automations.md` § 4.

## 10. Testing the engine

- **Golden cases**: a table of (battery, cosmetic, failed checks, repairs, retakes) → expected estimate/band/confidence. Assert the whole shape.
- **Band invariants**: contiguous, 1–3 grades, includes the estimate, A never yields a band below A, D never above D.
- **Reject order**: a submission with two defects must return the first in the table order.
- **No-price test**: assert the assessor's return type has no rupee-valued field.
- **Fallback test**: force a timeout/provider error and assert the deterministic result is used and the seller sees no error.
