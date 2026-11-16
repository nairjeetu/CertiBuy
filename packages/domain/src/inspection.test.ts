import { describe, it, expect } from "vitest";
import { confirmGrade, techFunctionGrade } from "./inspection.js";
import { DEFAULT_SETTINGS } from "../__fixtures__/settings.js";
import { INSPECTION_CASES } from "../__fixtures__/golden-cases.js";

describe("techFunctionGrade", () => {
  it("0 fails → A", () => expect(techFunctionGrade(0)).toBe("A"));
  it("1 fail → B", () => expect(techFunctionGrade(1)).toBe("B"));
  it("2 fails → C", () => expect(techFunctionGrade(2)).toBe("C"));
  it("3 fails → D", () => expect(techFunctionGrade(3)).toBe("D"));
  it("5 fails → D", () => expect(techFunctionGrade(5)).toBe("D"));
});

describe("confirmGrade (golden cases)", () => {
  for (const c of INSPECTION_CASES) {
    it(c.label, () => {
      const checklist: Record<string, "pass" | "fail"> = {};
      const keys = ["screen", "speakers", "microphone", "cameras", "charging", "sensors", "battery", "extra1", "extra2"];
      for (let i = 0; i < 9; i++) {
        checklist[keys[i]!] = i < c.failed_count ? "fail" : "pass";
      }

      const result = confirmGrade(
        { checklist, battery_health: c.battery_health, cosmetic_grade: c.cosmetic_grade },
        c.ai_band,
        DEFAULT_SETTINGS,
      );
      expect(result.final_grade).toBe(c.expected_final_grade);
      expect(result.verdict).toBe(c.expected_verdict);
    });
  }
});
