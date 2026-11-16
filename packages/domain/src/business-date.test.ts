import { describe, it, expect } from "vitest";
import { businessDate, diffDays, addDays } from "./business-date.js";
import { BUSINESS_DATE_CASES } from "../__fixtures__/golden-cases.js";
import { DEFAULT_SETTINGS } from "../__fixtures__/settings.js";

describe("businessDate", () => {
  for (const c of BUSINESS_DATE_CASES) {
    it(c.label, () => {
      const settings = { ...DEFAULT_SETTINGS, sim_day_offset: c.sim_day_offset };
      const result = businessDate(settings, new Date(c.real_iso));
      expect(result).toBe(c.expected_date);
    });
  }

  it("returns yyyy-mm-dd format", () => {
    const result = businessDate(DEFAULT_SETTINGS, new Date("2026-01-05T12:00:00+05:30"));
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("diffDays", () => {
  it("computes positive difference", () => {
    expect(diffDays("2026-11-01", "2026-11-15")).toBe(14);
  });

  it("computes zero for same day", () => {
    expect(diffDays("2026-11-01", "2026-11-01")).toBe(0);
  });
});

describe("addDays", () => {
  it("adds days", () => {
    expect(addDays("2026-11-17", 7)).toBe("2026-11-24");
  });

  it("crosses month boundary", () => {
    expect(addDays("2026-11-28", 5)).toBe("2026-12-03");
  });
});
