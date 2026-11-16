import { describe, it, expect } from "vitest";
import { scoreModel } from "./liquidity.js";
import { DEFAULT_SETTINGS } from "../__fixtures__/settings.js";
import { IPHONE_14, PIXEL_7 } from "../__fixtures__/models.js";
import type { DeviceModel } from "./types.js";

describe("scoreModel", () => {
  it("cold start: high tier → 80 baseline", () => {
    const result = scoreModel({
      model: IPHONE_14,
      sales: [],
      demand_score: 50,
      day45_returns: 0,
      today: "2026-11-17",
      settings: DEFAULT_SETTINGS,
    });
    expect(result.source).toBe("cold_start");
    expect(result.score).toBe(80);
  });

  it("cold start: low tier → 45 baseline", () => {
    const result = scoreModel({
      model: PIXEL_7,
      sales: [],
      demand_score: 50,
      day45_returns: 0,
      today: "2026-11-17",
      settings: DEFAULT_SETTINGS,
    });
    expect(result.source).toBe("cold_start");
    expect(result.score).toBe(45);
  });

  it("cold start with day45 penalty", () => {
    const result = scoreModel({
      model: IPHONE_14,
      sales: [{ device_model_id: IPHONE_14.id, days_to_sell: 10, achieved_price_ratio: 0.95 }],
      demand_score: 50,
      day45_returns: 2,
      today: "2026-11-17",
      settings: DEFAULT_SETTINGS,
    });
    expect(result.source).toBe("cold_start");
    expect(result.score).toBe(80 - 2 * 6);
  });

  it("measured with 3+ sales", () => {
    const sales = [
      { device_model_id: IPHONE_14.id, days_to_sell: 7, achieved_price_ratio: 0.95 },
      { device_model_id: IPHONE_14.id, days_to_sell: 10, achieved_price_ratio: 0.92 },
      { device_model_id: IPHONE_14.id, days_to_sell: 5, achieved_price_ratio: 0.98 },
    ];
    const result = scoreModel({
      model: IPHONE_14,
      sales,
      demand_score: 80,
      day45_returns: 0,
      today: "2026-11-17",
      settings: DEFAULT_SETTINGS,
    });
    expect(result.source).toBe("measured");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.days_to_sell).toBe(7);
    expect(typeof result.volatility).toBe("number");
  });

  it("score is clamped to 0-100", () => {
    const result = scoreModel({
      model: PIXEL_7,
      sales: [],
      demand_score: 0,
      day45_returns: 20,
      today: "2026-11-17",
      settings: DEFAULT_SETTINGS,
    });
    expect(result.score).toBe(0);
  });

  it("sim_day_offset moves launch window via business date", () => {
    const model: DeviceModel = {
      ...IPHONE_14,
      successor_launch_date: "2026-12-01",
    };

    const outside = scoreModel({
      model,
      sales: [],
      demand_score: 50,
      day45_returns: 0,
      today: "2026-11-01",
      settings: DEFAULT_SETTINGS,
    });
    expect(outside.launch_window).toBe(1);

    const inside = scoreModel({
      model,
      sales: [],
      demand_score: 50,
      day45_returns: 0,
      today: "2026-12-15",
      settings: DEFAULT_SETTINGS,
    });
    expect(inside.launch_window).toBe(0);
  });
});
