import type { Settings, DeviceModel, OfferBreakdown } from "./types.js";
import type { Grade, ConfidenceLevel, IcIneligibleReason } from "@certibuy/contracts";

export function gradePrice(
  model: DeviceModel,
  grade: Grade,
  settings: Settings,
): number {
  switch (grade) {
    case "A":
      return model.market_price_a;
    case "B":
      return model.market_price_b ?? Math.round(model.market_price_a * settings.grade_factor_b);
    case "C":
      return model.market_price_c ?? Math.round(model.market_price_a * settings.grade_factor_c);
    case "D":
      return model.market_price_d ?? Math.round(model.market_price_a * settings.grade_factor_d);
  }
}

export function gradePriceRaw(
  marketPriceA: number,
  grade: Grade,
  gradePriceOverride: number | null,
  gradeFactor: number,
): number {
  if (grade === "A") return marketPriceA;
  return gradePriceOverride ?? Math.round(marketPriceA * gradeFactor);
}

export function computeOffer(
  marketPrice: number,
  riskPct: number,
  settings: Settings,
): { guaranteed: number; instantCash: number; breakdown: OfferBreakdown } {
  const commission = Math.round(marketPrice * settings.commission_pct / 100);
  const risk = Math.round(marketPrice * riskPct / 100);
  const guaranteed = Math.round(marketPrice - commission - settings.inspection_fee);
  const instantCash = Math.round(guaranteed - risk);

  return {
    guaranteed,
    instantCash,
    breakdown: {
      market_price: marketPrice,
      commission,
      inspection_fee: settings.inspection_fee,
      risk,
      guaranteed,
      instant_cash: instantCash,
    },
  };
}

export function riskPct(score: number, settings: Settings): number {
  return score >= settings.liquidity_threshold + settings.near_band
    ? settings.risk_small_pct
    : settings.risk_large_pct;
}

export interface IcEligibilityInput {
  ic_paused: boolean;
  confidence: ConfidenceLevel;
  score: number;
  launch_window: boolean;
  total_exposure: number;
  model_exposure: number;
  settings: Settings;
}

export interface IcEligibilityResult {
  eligible: boolean;
  reason: IcIneligibleReason | null;
  effective_threshold: number;
  risk_pct: number;
  tier: string;
}

export function icEligibility(input: IcEligibilityInput): IcEligibilityResult {
  const { settings } = input;
  const effectiveThreshold = input.launch_window
    ? settings.liquidity_threshold + settings.launch_tighten_pts
    : settings.liquidity_threshold;

  const risk = riskPct(input.score, settings);
  const tier = input.score >= settings.liquidity_threshold + settings.near_band
    ? "Fast-selling"
    : "Steady";

  if (input.ic_paused) {
    return { eligible: false, reason: "paused", effective_threshold: effectiveThreshold, risk_pct: risk, tier };
  }
  if (input.confidence === "Low") {
    return { eligible: false, reason: "low_confidence", effective_threshold: effectiveThreshold, risk_pct: risk, tier };
  }
  if (input.score < effectiveThreshold) {
    return { eligible: false, reason: "low_liquidity", effective_threshold: effectiveThreshold, risk_pct: risk, tier };
  }
  if (input.total_exposure >= settings.inventory_cap) {
    return { eligible: false, reason: "inventory_cap", effective_threshold: effectiveThreshold, risk_pct: risk, tier };
  }
  if (input.model_exposure >= settings.per_model_cap) {
    return { eligible: false, reason: "model_cap", effective_threshold: effectiveThreshold, risk_pct: risk, tier };
  }

  return { eligible: true, reason: null, effective_threshold: effectiveThreshold, risk_pct: risk, tier };
}

export function isInPriceBand(price: number, settings: Settings): boolean {
  return price >= settings.price_band_min && price <= settings.price_band_max;
}
