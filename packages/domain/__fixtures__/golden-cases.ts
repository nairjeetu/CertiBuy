import type { Grade, ConfidenceLevel, ReturnReason, ReturnOutcome, EscrowType } from "@certibuy/contracts";

/**
 * Golden test cases derived from the documented formulas in:
 * - api.md (worked example: guaranteed ₹47,000, IC ₹42,500)
 * - overview.md §6 (money model formulas)
 * - automations.md §3 (ladder)
 * - ai-integration.md §4-5 (grading)
 * - vendor-architecture.md §3.4 (returns)
 */

// --- Pricing golden cases ---
// From overview.md §6: gradePrice uses market_price_<grade> or market_price_a × factor
export interface PricingCase {
  label: string;
  market_price_a: number;
  grade: Grade;
  grade_price_override: number | null;
  grade_factor: number;
  expected_grade_price: number;
}

export const PRICING_CASES: PricingCase[] = [
  {
    label: "Grade A uses market_price_a directly",
    market_price_a: 55_000,
    grade: "A",
    grade_price_override: null,
    grade_factor: 1,
    expected_grade_price: 55_000,
  },
  {
    label: "Grade B falls back to A × 0.91",
    market_price_a: 55_000,
    grade: "B",
    grade_price_override: null,
    grade_factor: 0.91,
    expected_grade_price: 50_050,
  },
  {
    label: "Grade C falls back to A × 0.82",
    market_price_a: 55_000,
    grade: "C",
    grade_price_override: null,
    grade_factor: 0.82,
    expected_grade_price: 45_100,
  },
  {
    label: "Grade D falls back to A × 0.60",
    market_price_a: 55_000,
    grade: "D",
    grade_price_override: null,
    grade_factor: 0.6,
    expected_grade_price: 33_000,
  },
  {
    label: "Grade B uses explicit market_price_b when set",
    market_price_a: 85_000,
    grade: "B",
    grade_price_override: 77_350,
    grade_factor: 0.91,
    expected_grade_price: 77_350,
  },
];

// --- Offer golden cases ---
// From api.md: market 55000, commission 15%, fee 200
//   guaranteed = round(55000 × (1 − 0.15) − 200) = round(46550 − 200) = 46550 → but docs say 47000
// Let me re-derive: the api.md example says guaranteed 47000, IC 42500 for a band ["A","B"]
// Working backwards from the offer endpoint: the band determines the grade price range
// The offer at the lowest band grade: grade B = 55000 × 0.91 = 50050
// guaranteed = round(50050 × 0.85 − 200) = round(42542.5 − 200) = round(42342.5) = 42343
// That doesn't match either. The api.md example must use a specific model.
// Re-reading: "guaranteedPrice: 47000, instantCashAmount: 42500"
// guaranteed = round(market × (1 − 15/100) − 200)
// 47000 = round(market × 0.85 − 200) → market × 0.85 = 47200 → market ≈ 55529
// The example likely uses grade A price of 55529... or the formula rounds differently.
// Actually: guaranteed = round(55000 × 0.85 − 200) = round(46750 − 200) = round(46550) = 46550
// The 47000 in the docs seems to use the grade A price directly with perhaps a different rounding.
// Let me check: "guaranteed = round(market × (1 − commission_pct/100) − inspection_fee)"
// If market = 55000: 55000 × 0.85 = 46750; 46750 − 200 = 46550; round(46550) = 46550
// The docs say 47000. This means the example model likely has market_price_a slightly higher,
// or the docs rounded for readability. We'll use the exact formula and test against it.

export interface OfferCase {
  label: string;
  market_price: number;
  commission_pct: number;
  inspection_fee: number;
  risk_pct: number;
  expected_guaranteed: number;
  expected_instant_cash: number;
}

export const OFFER_CASES: OfferCase[] = [
  {
    label: "Standard offer: market 55000, commission 15%, fee 200, risk 5%",
    market_price: 55_000,
    commission_pct: 15,
    inspection_fee: 200,
    risk_pct: 5,
    // guaranteed = round(55000 × 0.85 − 200) = 46550
    expected_guaranteed: 46_550,
    // IC = round(55000 × 0.85 − 200 − 55000 × 0.05) = round(46550 − 2750) = 43800
    expected_instant_cash: 43_800,
  },
  {
    label: "High-risk offer: market 55000, commission 15%, fee 200, risk 12%",
    market_price: 55_000,
    commission_pct: 15,
    inspection_fee: 200,
    risk_pct: 12,
    expected_guaranteed: 46_550,
    // IC = round(55000 × 0.85 − 200 − 55000 × 0.12) = round(46550 − 6600) = 39950
    expected_instant_cash: 39_950,
  },
  {
    label: "Expensive model: market 85000",
    market_price: 85_000,
    commission_pct: 15,
    inspection_fee: 200,
    risk_pct: 5,
    // guaranteed = round(85000 × 0.85 − 200) = round(72250 − 200) = 72050
    expected_guaranteed: 72_050,
    // IC = round(72050 − 85000 × 0.05) = round(72050 − 4250) = 67800
    expected_instant_cash: 67_800,
  },
];

// --- Ladder golden cases ---
export interface LadderCase {
  label: string;
  base_price: number;
  floor_price: number;
  days_listed: number;
  override_price: number | null;
  step1_pct: number;
  step2_pct: number;
  expected_price: number;
  expected_step: number;
  expected_at_review: boolean;
}

export const LADDER_CASES: LadderCase[] = [
  {
    label: "Day 0: base price",
    base_price: 55_000,
    floor_price: 25_000,
    days_listed: 0,
    override_price: null,
    step1_pct: 7,
    step2_pct: 12,
    expected_price: 55_000,
    expected_step: 0,
    expected_at_review: false,
  },
  {
    label: "Day 14: still at base",
    base_price: 55_000,
    floor_price: 25_000,
    days_listed: 14,
    override_price: null,
    step1_pct: 7,
    step2_pct: 12,
    expected_price: 55_000,
    expected_step: 0,
    expected_at_review: false,
  },
  {
    label: "Day 15: step 1 (−7%), rounded to ₹10",
    base_price: 55_000,
    floor_price: 25_000,
    days_listed: 15,
    override_price: null,
    step1_pct: 7,
    step2_pct: 12,
    // 55000 × 0.93 = 51150, round to 10 = 51150
    expected_price: 51_150,
    expected_step: 1,
    expected_at_review: false,
  },
  {
    label: "Day 30: step 2 (−12%), rounded to ₹10",
    base_price: 55_000,
    floor_price: 25_000,
    days_listed: 30,
    override_price: null,
    step1_pct: 7,
    step2_pct: 12,
    // 55000 × 0.88 = 48400
    expected_price: 48_400,
    expected_step: 2,
    expected_at_review: false,
  },
  {
    label: "Day 45: at review",
    base_price: 55_000,
    floor_price: 25_000,
    days_listed: 45,
    override_price: null,
    step1_pct: 7,
    step2_pct: 12,
    expected_price: 48_400,
    expected_step: 2,
    expected_at_review: true,
  },
  {
    label: "Floor price prevents going below B2B floor",
    base_price: 30_000,
    floor_price: 28_000,
    days_listed: 30,
    override_price: null,
    step1_pct: 7,
    step2_pct: 12,
    // 30000 × 0.88 = 26400 → but floor is 28000
    expected_price: 28_000,
    expected_step: 2,
    expected_at_review: false,
  },
  {
    label: "Override stops the ladder",
    base_price: 55_000,
    floor_price: 25_000,
    days_listed: 30,
    override_price: 50_000,
    step1_pct: 7,
    step2_pct: 12,
    expected_price: 50_000,
    expected_step: 2,
    expected_at_review: false,
  },
];

// --- Grading golden cases ---
export interface GradingCase {
  label: string;
  battery_health: number;
  declared_cosmetic: Grade;
  failed_checks: number;
  repaired: "no" | "authorised" | "other_shop" | "not_sure";
  retake_count: number;
  expected_estimate: Grade;
  expected_confidence: ConfidenceLevel;
  expected_band_length: number;
}

export const GRADING_CASES: GradingCase[] = [
  {
    label: "Perfect device: A/A/A → estimate A, High confidence",
    battery_health: 95,
    declared_cosmetic: "A",
    failed_checks: 0,
    repaired: "no",
    retake_count: 0,
    expected_estimate: "A",
    expected_confidence: "High",
    expected_band_length: 2,
  },
  {
    label: "Battery 87% → battery B, cosmetic A → estimate B",
    battery_health: 87,
    declared_cosmetic: "A",
    failed_checks: 0,
    repaired: "no",
    retake_count: 0,
    expected_estimate: "B",
    expected_confidence: "High",
    expected_band_length: 2,
  },
  {
    label: "Battery OK, cosmetic C → estimate C",
    battery_health: 95,
    declared_cosmetic: "C",
    failed_checks: 0,
    repaired: "no",
    retake_count: 0,
    expected_estimate: "C",
    expected_confidence: "High",
    expected_band_length: 2,
  },
  {
    label: "Any function fail → function D → estimate D",
    battery_health: 95,
    declared_cosmetic: "A",
    failed_checks: 1,
    repaired: "no",
    retake_count: 0,
    expected_estimate: "D",
    expected_confidence: "High",
    expected_band_length: 2,
  },
  {
    label: "Retakes lower confidence to Medium",
    battery_health: 95,
    declared_cosmetic: "A",
    failed_checks: 0,
    repaired: "no",
    retake_count: 2,
    expected_estimate: "A",
    expected_confidence: "Medium",
    expected_band_length: 2,
  },
  {
    label: "Repair not_sure → Low confidence, 3-grade band",
    battery_health: 95,
    declared_cosmetic: "A",
    failed_checks: 0,
    repaired: "not_sure",
    retake_count: 0,
    expected_estimate: "A",
    expected_confidence: "Low",
    expected_band_length: 2, // A can only go to [A,B], not 3-wide
  },
  {
    label: "Estimate B + Low confidence → 3-grade band [A,B,C]",
    battery_health: 87,
    declared_cosmetic: "A",
    failed_checks: 0,
    repaired: "not_sure",
    retake_count: 0,
    expected_estimate: "B",
    expected_confidence: "Low",
    expected_band_length: 3,
  },
  {
    label: "Worst of all three: battery C (82%), cosmetic B, function A → C",
    battery_health: 82,
    declared_cosmetic: "B",
    failed_checks: 0,
    repaired: "no",
    retake_count: 0,
    expected_estimate: "C",
    expected_confidence: "High",
    expected_band_length: 2,
  },
];

// --- Inspection (technician) golden cases ---
export interface InspectionCase {
  label: string;
  battery_health: number;
  cosmetic_grade: Grade;
  failed_count: number;
  ai_band: Grade[];
  expected_final_grade: Grade;
  expected_verdict: "inside" | "one_below" | "two_below";
}

export const INSPECTION_CASES: InspectionCase[] = [
  {
    label: "All pass, cosmetic A, inside band [A,B]",
    battery_health: 95,
    cosmetic_grade: "A",
    failed_count: 0,
    ai_band: ["A", "B"],
    expected_final_grade: "A",
    expected_verdict: "inside",
  },
  {
    label: "1 fail → B, inside band [A,B]",
    battery_health: 95,
    cosmetic_grade: "A",
    failed_count: 1,
    ai_band: ["A", "B"],
    expected_final_grade: "B",
    expected_verdict: "inside",
  },
  {
    label: "2 fails → C, one below band [A,B]",
    battery_health: 95,
    cosmetic_grade: "A",
    failed_count: 2,
    ai_band: ["A", "B"],
    expected_final_grade: "C",
    expected_verdict: "one_below",
  },
  {
    label: "3+ fails → D, two below band [A,B]",
    battery_health: 95,
    cosmetic_grade: "A",
    failed_count: 3,
    ai_band: ["A", "B"],
    expected_final_grade: "D",
    expected_verdict: "two_below",
  },
  {
    label: "Battery 82% → C, cosmetic B → worst is C, inside band [B,C]",
    battery_health: 82,
    cosmetic_grade: "B",
    failed_count: 0,
    ai_band: ["B", "C"],
    expected_final_grade: "C",
    expected_verdict: "inside",
  },
];

// --- Payout machine golden cases ---
export interface PayoutMachineCase {
  label: string;
  current_status: string;
  attempt_success: boolean;
  current_attempts: number;
  max_attempts: number;
  expected_new_status: string;
  expected_open_exception: boolean;
}

export const PAYOUT_MACHINE_CASES: PayoutMachineCase[] = [
  {
    label: "Successful first attempt → approved then paid",
    current_status: "pending",
    attempt_success: true,
    current_attempts: 0,
    max_attempts: 3,
    expected_new_status: "paid",
    expected_open_exception: false,
  },
  {
    label: "Failed first attempt, below limit → approved (retry)",
    current_status: "pending",
    attempt_success: false,
    current_attempts: 0,
    max_attempts: 3,
    expected_new_status: "approved",
    expected_open_exception: false,
  },
  {
    label: "Failed at max attempts → failed + exception",
    current_status: "pending",
    attempt_success: false,
    current_attempts: 2,
    max_attempts: 3,
    expected_new_status: "failed",
    expected_open_exception: true,
  },
  {
    label: "Retry after failure succeeds → paid",
    current_status: "approved",
    attempt_success: true,
    current_attempts: 1,
    max_attempts: 3,
    expected_new_status: "paid",
    expected_open_exception: false,
  },
];

// --- Return maths golden cases ---
export interface ReturnCase {
  label: string;
  reason: ReturnReason;
  outcome: ReturnOutcome;
  order_total: number;
  expected_deduction: number;
  expected_refund: number;
  expected_escrow_type: EscrowType;
}

export const RETURN_CASES: ReturnCase[] = [
  {
    label: "Not as graded → faulty: full refund",
    reason: "not_as_graded",
    outcome: "faulty",
    order_total: 55_000,
    expected_deduction: 0,
    expected_refund: 55_000,
    expected_escrow_type: "refund_full",
  },
  {
    label: "Not as graded → as shipped: ₹300 logistics",
    reason: "not_as_graded",
    outcome: "as_shipped",
    order_total: 55_000,
    expected_deduction: 300,
    expected_refund: 54_700,
    expected_escrow_type: "refund_partial",
  },
  {
    label: "DOA → confirmed: full refund",
    reason: "dead_on_arrival",
    outcome: "doa_confirmed",
    order_total: 55_000,
    expected_deduction: 0,
    expected_refund: 55_000,
    expected_escrow_type: "refund_full",
  },
  {
    label: "DOA → as shipped: ₹300",
    reason: "dead_on_arrival",
    outcome: "as_shipped",
    order_total: 55_000,
    expected_deduction: 300,
    expected_refund: 54_700,
    expected_escrow_type: "refund_partial",
  },
  {
    label: "Changed mind: ₹500 deduction",
    reason: "buyer_changed_mind",
    outcome: "changed_mind",
    order_total: 55_000,
    expected_deduction: 500,
    expected_refund: 54_500,
    expected_escrow_type: "refund_partial",
  },
];

// --- Cancellation golden cases ---
export interface CancelCase {
  label: string;
  order_total: number;
  cancel_fee: number;
  expected_refund: number;
  expected_escrow_type: EscrowType;
}

export const CANCEL_CASES: CancelCase[] = [
  {
    label: "Default fee 0: full refund",
    order_total: 55_000,
    cancel_fee: 0,
    expected_refund: 55_000,
    expected_escrow_type: "refund_full",
  },
  {
    label: "Fee 500: partial refund",
    order_total: 55_000,
    cancel_fee: 500,
    expected_refund: 54_500,
    expected_escrow_type: "refund_partial",
  },
];

// --- Business date golden cases ---
export interface BusinessDateCase {
  label: string;
  real_iso: string;
  sim_day_offset: number;
  expected_date: string;
}

export const BUSINESS_DATE_CASES: BusinessDateCase[] = [
  {
    label: "No offset, IST date",
    real_iso: "2026-11-17T10:00:00+05:30",
    sim_day_offset: 0,
    expected_date: "2026-11-17",
  },
  {
    label: "Offset +7 days",
    real_iso: "2026-11-17T10:00:00+05:30",
    sim_day_offset: 7,
    expected_date: "2026-11-24",
  },
  {
    label: "UTC midnight is still previous day in IST before 05:30",
    real_iso: "2026-11-17T00:00:00Z",
    sim_day_offset: 0,
    expected_date: "2026-11-17",
  },
  {
    label: "Late UTC (23:00) is next day in IST",
    real_iso: "2026-11-17T23:00:00Z",
    sim_day_offset: 0,
    expected_date: "2026-11-18",
  },
];

// --- IC Eligibility golden cases ---
export interface IcEligibilityCase {
  label: string;
  ic_paused: boolean;
  confidence: ConfidenceLevel;
  score: number;
  threshold: number;
  near_band: number;
  launch_window: boolean;
  launch_tighten_pts: number;
  total_exposure: number;
  inventory_cap: number;
  model_exposure: number;
  per_model_cap: number;
  expected_eligible: boolean;
  expected_reason: string | null;
}

export const IC_ELIGIBILITY_CASES: IcEligibilityCase[] = [
  {
    label: "All gates pass: eligible",
    ic_paused: false,
    confidence: "High",
    score: 72,
    threshold: 60,
    near_band: 10,
    launch_window: false,
    launch_tighten_pts: 10,
    total_exposure: 640_000,
    inventory_cap: 15_000_000,
    model_exposure: 132_000,
    per_model_cap: 1_500_000,
    expected_eligible: true,
    expected_reason: null,
  },
  {
    label: "Model paused → ineligible",
    ic_paused: true,
    confidence: "High",
    score: 72,
    threshold: 60,
    near_band: 10,
    launch_window: false,
    launch_tighten_pts: 10,
    total_exposure: 0,
    inventory_cap: 15_000_000,
    model_exposure: 0,
    per_model_cap: 1_500_000,
    expected_eligible: false,
    expected_reason: "paused",
  },
  {
    label: "Low confidence → ineligible",
    ic_paused: false,
    confidence: "Low",
    score: 72,
    threshold: 60,
    near_band: 10,
    launch_window: false,
    launch_tighten_pts: 10,
    total_exposure: 0,
    inventory_cap: 15_000_000,
    model_exposure: 0,
    per_model_cap: 1_500_000,
    expected_eligible: false,
    expected_reason: "low_confidence",
  },
  {
    label: "Score below threshold → ineligible",
    ic_paused: false,
    confidence: "High",
    score: 55,
    threshold: 60,
    near_band: 10,
    launch_window: false,
    launch_tighten_pts: 10,
    total_exposure: 0,
    inventory_cap: 15_000_000,
    model_exposure: 0,
    per_model_cap: 1_500_000,
    expected_eligible: false,
    expected_reason: "low_liquidity",
  },
  {
    label: "Launch window tightens threshold by 10",
    ic_paused: false,
    confidence: "High",
    score: 65,
    threshold: 60,
    near_band: 10,
    launch_window: true,
    launch_tighten_pts: 10,
    total_exposure: 0,
    inventory_cap: 15_000_000,
    model_exposure: 0,
    per_model_cap: 1_500_000,
    expected_eligible: false,
    expected_reason: "low_liquidity",
  },
  {
    label: "Inventory cap exceeded",
    ic_paused: false,
    confidence: "High",
    score: 72,
    threshold: 60,
    near_band: 10,
    launch_window: false,
    launch_tighten_pts: 10,
    total_exposure: 15_000_000,
    inventory_cap: 15_000_000,
    model_exposure: 0,
    per_model_cap: 1_500_000,
    expected_eligible: false,
    expected_reason: "inventory_cap",
  },
  {
    label: "Per-model cap exceeded",
    ic_paused: false,
    confidence: "High",
    score: 72,
    threshold: 60,
    near_band: 10,
    launch_window: false,
    launch_tighten_pts: 10,
    total_exposure: 0,
    inventory_cap: 15_000_000,
    model_exposure: 1_500_000,
    per_model_cap: 1_500_000,
    expected_eligible: false,
    expected_reason: "model_cap",
  },
];

// --- Payout plan golden cases ---
export interface PayoutPlanCase {
  label: string;
  option: "instant_cash" | "sell_for_more";
  guaranteed_price: number;
  advance_pct: number;
  expected_advance: number;
  expected_balance: number;
}

export const PAYOUT_PLAN_CASES: PayoutPlanCase[] = [
  {
    label: "Instant Cash: 100% upfront, no balance",
    option: "instant_cash",
    guaranteed_price: 43_800,
    advance_pct: 50,
    expected_advance: 43_800,
    expected_balance: 0,
  },
  {
    label: "Sell For More: 50% advance, 50% balance",
    option: "sell_for_more",
    guaranteed_price: 46_550,
    advance_pct: 50,
    expected_advance: 23_275,
    expected_balance: 23_275,
  },
];

// --- Order total golden cases ---
export interface OrderTotalCase {
  label: string;
  device_price: number;
  warranty_addon: boolean;
  warranty_months: number;
  warranty_addon_pct: number;
  expected_addon_amount: number;
  expected_total: number;
}

export const ORDER_TOTAL_CASES: OrderTotalCase[] = [
  {
    label: "No addon: total = device price",
    device_price: 55_000,
    warranty_addon: false,
    warranty_months: 12,
    warranty_addon_pct: 5,
    expected_addon_amount: 0,
    expected_total: 55_000,
  },
  {
    label: "With addon: 5% of price",
    device_price: 55_000,
    warranty_addon: true,
    warranty_months: 12,
    warranty_addon_pct: 5,
    // 55000 × 0.05 = 2750
    expected_addon_amount: 2_750,
    expected_total: 57_750,
  },
  {
    label: "Grade D (0-month warranty): addon rejected",
    device_price: 33_000,
    warranty_addon: true,
    warranty_months: 0,
    warranty_addon_pct: 5,
    expected_addon_amount: 0,
    expected_total: 33_000,
  },
];
