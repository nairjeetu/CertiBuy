import { describe, it, expect } from "vitest";
import { gradePrice, gradePriceRaw, computeOffer, icEligibility, riskPct } from "./pricing.js";
import { DEFAULT_SETTINGS } from "../__fixtures__/settings.js";
import { IPHONE_14, GALAXY_S24 } from "../__fixtures__/models.js";
import {
  PRICING_CASES,
  OFFER_CASES,
  IC_ELIGIBILITY_CASES,
} from "../__fixtures__/golden-cases.js";

describe("gradePrice", () => {
  for (const c of PRICING_CASES) {
    it(c.label, () => {
      const result = gradePriceRaw(
        c.market_price_a,
        c.grade,
        c.grade_price_override,
        c.grade_factor,
      );
      expect(result).toBe(c.expected_grade_price);
    });
  }

  it("uses model's grade prices via gradePrice()", () => {
    expect(gradePrice(IPHONE_14, "A", DEFAULT_SETTINGS)).toBe(55_000);
    expect(gradePrice(IPHONE_14, "B", DEFAULT_SETTINGS)).toBe(
      Math.round(55_000 * 0.91),
    );
    expect(gradePrice(GALAXY_S24, "B", DEFAULT_SETTINGS)).toBe(77_350);
  });
});

describe("computeOffer", () => {
  for (const c of OFFER_CASES) {
    it(c.label, () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        commission_pct: c.commission_pct,
        inspection_fee: c.inspection_fee,
      };
      const result = computeOffer(c.market_price, c.risk_pct, settings);
      expect(result.guaranteed).toBe(c.expected_guaranteed);
      expect(result.instantCash).toBe(c.expected_instant_cash);
      expect(result.breakdown.market_price).toBe(c.market_price);
    });
  }
});

describe("riskPct", () => {
  it("returns small risk for fast-selling model", () => {
    expect(riskPct(72, DEFAULT_SETTINGS)).toBe(5);
  });

  it("returns large risk for steady model", () => {
    expect(riskPct(65, DEFAULT_SETTINGS)).toBe(12);
  });

  it("threshold + near_band is the cutoff", () => {
    expect(riskPct(70, DEFAULT_SETTINGS)).toBe(5);
    expect(riskPct(69, DEFAULT_SETTINGS)).toBe(12);
  });
});

describe("icEligibility", () => {
  for (const c of IC_ELIGIBILITY_CASES) {
    it(c.label, () => {
      const settings = {
        ...DEFAULT_SETTINGS,
        liquidity_threshold: c.threshold,
        near_band: c.near_band,
        launch_tighten_pts: c.launch_tighten_pts,
        inventory_cap: c.inventory_cap,
        per_model_cap: c.per_model_cap,
      };
      const result = icEligibility({
        ic_paused: c.ic_paused,
        confidence: c.confidence,
        score: c.score,
        launch_window: c.launch_window,
        total_exposure: c.total_exposure,
        model_exposure: c.model_exposure,
        settings,
      });
      expect(result.eligible).toBe(c.expected_eligible);
      expect(result.reason).toBe(c.expected_reason);
    });
  }
});
