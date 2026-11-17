import type { LiquidityInput, LiquidityResult } from "./types";
import { TIER_COLD_START_SCORE } from "@certibuy/contracts";
import { diffDays } from "./business-date";

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function medianValue(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

export function scoreModel(input: LiquidityInput): LiquidityResult {
  const { model, sales, demand_score, day45_returns, today, settings } = input;

  const isInLaunchWindow =
    model.successor_launch_date != null &&
    (() => {
      const daysUntil = diffDays(today, model.successor_launch_date!);
      return daysUntil >= 0 && daysUntil <= settings.launch_window_days;
    })();
  const launchWindow = isInLaunchWindow ? 1 : 0;

  if (sales.length < 3) {
    const tierScore = TIER_COLD_START_SCORE[model.liquidity_tier];
    const penalty = day45_returns * settings.liq_review_penalty;
    return {
      score: clamp(tierScore - penalty, 0, 100),
      source: "cold_start",
      days_to_sell: null,
      volatility: null,
      launch_window: launchWindow,
    };
  }

  const daysValues = sales.map((s) => s.days_to_sell);
  const ratioValues = sales.map((s) => s.achieved_price_ratio);

  const avgDays = mean(daysValues);
  const medDays = medianValue(daysValues);

  const volatility =
    mean(ratioValues) !== 0
      ? (stdev(ratioValues) / mean(ratioValues)) * 100
      : 0;

  const cappedDays = Math.min(avgDays, settings.review_day);
  const daysScore =
    (100 * (settings.review_day - cappedDays)) /
    (settings.review_day - settings.review_day / 6);

  const launchScore = isInLaunchWindow ? 0 : 100;

  const raw =
    (settings.liq_w_days / 100) * daysScore +
    (settings.liq_w_demand / 100) * demand_score +
    (settings.liq_w_volatility / 100) * (100 - volatility) +
    (settings.liq_w_launch / 100) * launchScore;

  const penalty = day45_returns * settings.liq_review_penalty;
  const score = clamp(Math.round(raw - penalty), 0, 100);

  return {
    score,
    source: "measured",
    days_to_sell: medDays,
    volatility: Math.round(volatility * 100) / 100,
    launch_window: launchWindow,
  };
}
