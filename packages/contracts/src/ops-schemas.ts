import { z } from "zod";

const cuid = z.string().min(1);

// ─── Ops commands (O-01 … O-15) ────────────────────────────────────────────

export const RunDailyJobsInput = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const AdvanceDemoClockInput = z.object({
  days: z.number().int().min(1).max(30),
});

export const RecalcLiquidityInput = z.object({});

export const ComputeMetricsInput = z.object({});

export const ResolveExceptionInput = z.object({
  exceptionId: cuid,
  resolution: z.string().min(1).max(1000),
});

export const UpdateSettingsInput = z.object({
  commission_pct: z.number().int().min(0).max(100).optional(),
  inspection_fee: z.number().int().min(0).optional(),
  mismatch_fee: z.number().int().min(0).optional(),
  return_logistics_charge: z.number().int().min(0).optional(),
  change_mind_fee: z.number().int().min(0).optional(),
  warranty_months: z.number().int().min(0).optional(),
  warranty_addon_pct: z.number().int().min(0).max(100).optional(),
  advance_pct: z.number().int().min(0).max(100).optional(),
  balance_day: z.number().int().min(1).optional(),
  payout_max_attempts: z.number().int().min(1).optional(),
  step1_day: z.number().int().min(1).optional(),
  step1_pct: z.number().int().min(0).max(100).optional(),
  step2_day: z.number().int().min(1).optional(),
  step2_pct: z.number().int().min(0).max(100).optional(),
  review_day: z.number().int().min(1).optional(),
  alert_window_days: z.number().int().min(1).optional(),
  return_window_days: z.number().int().min(1).optional(),
  liquidity_threshold: z.number().int().min(0).max(100).optional(),
  near_band: z.number().int().min(0).optional(),
  risk_small_pct: z.number().int().min(0).max(100).optional(),
  risk_large_pct: z.number().int().min(0).max(100).optional(),
  launch_window_days: z.number().int().min(0).optional(),
  launch_tighten_pts: z.number().int().min(0).optional(),
  liq_w_days: z.number().int().min(0).max(100).optional(),
  liq_w_demand: z.number().int().min(0).max(100).optional(),
  liq_w_volatility: z.number().int().min(0).max(100).optional(),
  liq_w_launch: z.number().int().min(0).max(100).optional(),
  liq_review_penalty: z.number().int().min(0).optional(),
  inventory_cap: z.number().int().min(0).optional(),
  per_model_cap: z.number().int().min(0).optional(),
  price_band_min: z.number().int().min(0).optional(),
  price_band_max: z.number().int().min(0).optional(),
  grade_factor_b: z.number().min(0).max(1).optional(),
  grade_factor_c: z.number().min(0).max(1).optional(),
  grade_factor_d: z.number().min(0).max(1).optional(),
  battery_a_min: z.number().int().min(0).max(100).optional(),
  battery_b_min: z.number().int().min(0).max(100).optional(),
  battery_c_min: z.number().int().min(0).max(100).optional(),
  offer_expiry_days: z.number().int().min(1).optional(),
  checkout_hold_minutes: z.number().int().min(1).optional(),
  cancel_fee: z.number().int().min(0).optional(),
  hub_cost: z.number().int().min(0).optional(),
});

export const TogglePayoutFailureInput = z.object({
  enabled: z.boolean(),
});

export const SaveDeviceModelInput = z.object({
  id: cuid.optional(),
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(200),
  storage: z.string().min(1).max(50),
  category: z.enum(["phone", "laptop", "tablet", "watch"]),
  original_price: z.number().int().min(1),
  market_price_a: z.number().int().min(1),
  market_price_b: z.number().int().min(0).optional(),
  market_price_c: z.number().int().min(0).optional(),
  market_price_d: z.number().int().min(0).optional(),
  b2b_floor_price: z.number().int().min(1),
  liquidity_tier: z.enum(["high", "medium", "low"]),
  launch_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  successor_launch_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ic_paused: z.boolean().optional(),
  active: z.boolean().optional(),
});
