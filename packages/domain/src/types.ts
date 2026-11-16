import type {
  Grade,
  ConfidenceLevel,
  PayoutStatus,
  PayoutType,
  ListingStatus,
  EscrowType,
  IcIneligibleReason,
  LiquidityTier,
  Category,
} from "@certibuy/contracts";

export interface Settings {
  commission_pct: number;
  inspection_fee: number;
  mismatch_fee: number;
  return_logistics_charge: number;
  change_mind_fee: number;
  warranty_months: number;
  warranty_addon_pct: number;
  advance_pct: number;
  balance_day: number;
  payout_max_attempts: number;
  step1_day: number;
  step1_pct: number;
  step2_day: number;
  step2_pct: number;
  review_day: number;
  alert_window_days: number;
  return_window_days: number;
  liquidity_threshold: number;
  near_band: number;
  risk_small_pct: number;
  risk_large_pct: number;
  launch_window_days: number;
  launch_tighten_pts: number;
  liq_w_days: number;
  liq_w_demand: number;
  liq_w_volatility: number;
  liq_w_launch: number;
  liq_review_penalty: number;
  inventory_cap: number;
  per_model_cap: number;
  price_band_min: number;
  price_band_max: number;
  grade_factor_b: number;
  grade_factor_c: number;
  grade_factor_d: number;
  battery_a_min: number;
  battery_b_min: number;
  battery_c_min: number;
  photo_retake_medium: number;
  photo_min_px: number;
  photo_min_brightness: number;
  offer_expiry_days: number;
  checkout_hold_minutes: number;
  cancel_fee: number;
  hub_cost: number;
  demo_mode: boolean;
  sim_day_offset: number;
  simulate_payout_failure: boolean;
}

export interface DeviceModel {
  id: string;
  brand: string;
  model: string;
  storage: string;
  category: Category;
  launch_date: string | null;
  successor_launch_date: string | null;
  original_price: number;
  market_price_a: number;
  market_price_b: number | null;
  market_price_c: number | null;
  market_price_d: number | null;
  b2b_floor_price: number;
  liquidity_tier: LiquidityTier;
  ic_paused: boolean;
  active: boolean;
}

export interface LiquidityScore {
  device_model_id: string;
  score: number;
  days_to_sell: number | null;
  volatility: number | null;
  launch_window: number;
  source: "measured" | "cold_start" | "seeded";
  is_current: boolean;
}

export interface GradeAssessment {
  estimate: Grade;
  band: Grade[];
  confidence: ConfidenceLevel;
  confidence_numeric: number;
  factors: string[];
}

export interface Submission {
  id: string;
  seller_id: string;
  device_model_id: string;
  imei: string;
  declared_cosmetic: Grade;
  repaired: "no" | "authorised" | "other_shop" | "not_sure";
  water_exposure: boolean;
  diagnostics: DiagnosticsResult;
  photos: PhotoRecord[];
  retake_count: number;
  category: Category;
}

export interface DiagnosticsResult {
  battery: "pass" | "fail";
  screen: "pass" | "fail";
  speakers: "pass" | "fail";
  microphone: "pass" | "fail";
  cameras: "pass" | "fail";
  charging: "pass" | "fail";
  sensors: "pass" | "fail";
  imei_blacklist: "pass" | "fail";
  activation_lock: "pass" | "fail" | "on" | "off";
  battery_health: number;
}

export interface PhotoRecord {
  key: string;
  brightness: number;
  ok: boolean;
}

export interface Offer {
  guaranteed_price: number;
  instant_cash_amount: number;
  ic_eligible: boolean;
  ic_reason: IcIneligibleReason | null;
  risk_pct: number;
  risk_tier: "low" | "medium" | "high";
  breakdown: OfferBreakdown;
}

export interface OfferBreakdown {
  market_price: number;
  commission: number;
  inspection_fee: number;
  risk: number;
  guaranteed: number;
  instant_cash: number;
}

export interface Listing {
  id: string;
  device_id: string;
  base_price: number;
  current_price: number;
  floor_price: number;
  ladder_step: number;
  listed_at: string;
  reserved_days: number;
  override_price: number | null;
  warranty_months: number;
  status: ListingStatus;
}

export interface LadderResult {
  current_price: number;
  ladder_step: number;
  days_listed: number;
  at_review: boolean;
}

export interface PayoutRecord {
  id: string;
  type: PayoutType;
  amount: number;
  status: PayoutStatus;
  attempts: number;
  failure_reason: string;
}

export interface PayoutAttemptResult {
  success: boolean;
  reference?: string;
  failure_reason?: string;
}

export interface PayoutTransition {
  new_status: PayoutStatus;
  open_exception: boolean;
  paid_at: string | null;
}

export interface PayoutPlan {
  advance: number;
  balance: number;
  balance_trigger: "buyer_paid_escrow" | "day_21_unsold";
}

export interface OrderTotalResult {
  device_price: number;
  warranty_addon: boolean;
  warranty_addon_amount: number;
  total: number;
}

export interface CancelRefundResult {
  refund: number;
  deduction: number;
  escrow_type: EscrowType;
}

export interface ReturnRaiseMath {
  original: number;
  deduction: number;
  deduction_label: string | null;
  refund: number;
}

export interface ReturnResolutionMath {
  original: number;
  deduction: number;
  deduction_label: string | null;
  refund: number;
  escrow_type: EscrowType;
}

export interface SaleRecord {
  device_model_id: string;
  days_to_sell: number;
  achieved_price_ratio: number;
}

export interface LiquidityInput {
  model: DeviceModel;
  sales: SaleRecord[];
  demand_score: number;
  day45_returns: number;
  today: string;
  settings: Settings;
}

export interface LiquidityResult {
  score: number;
  source: "measured" | "cold_start";
  days_to_sell: number | null;
  volatility: number | null;
  launch_window: number;
}

export interface InspectionInput {
  checklist: Record<string, "pass" | "fail">;
  battery_health: number;
  cosmetic_grade: Grade;
}

export interface InspectionResult {
  component_grades: {
    battery: Grade;
    cosmetic: Grade;
    functions: Grade;
  };
  final_grade: Grade;
  verdict: "inside" | "one_below" | "two_below";
}
