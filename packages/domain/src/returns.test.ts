import { describe, it, expect } from "vitest";
import { raiseMath, resolutionMath, outcomesFor, validateOutcome } from "./returns.js";
import { DEFAULT_SETTINGS } from "../__fixtures__/settings.js";
import { RETURN_CASES } from "../__fixtures__/golden-cases.js";


describe("resolutionMath (golden cases)", () => {
  for (const c of RETURN_CASES) {
    it(c.label, () => {
      const result = resolutionMath(c.order_total, c.outcome, DEFAULT_SETTINGS);
      expect(result.deduction).toBe(c.expected_deduction);
      expect(result.refund).toBe(c.expected_refund);
      expect(result.escrow_type).toBe(c.expected_escrow_type);
    });
  }
});

describe("raiseMath", () => {
  it("changed mind shows ₹500 deduction", () => {
    const result = raiseMath(55_000, "buyer_changed_mind", DEFAULT_SETTINGS);
    expect(result.deduction).toBe(500);
    expect(result.refund).toBe(54_500);
  });

  it("not_as_graded shows full refund estimate", () => {
    const result = raiseMath(55_000, "not_as_graded", DEFAULT_SETTINGS);
    expect(result.deduction).toBe(0);
    expect(result.refund).toBe(55_000);
  });
});

describe("outcomesFor", () => {
  it("not_as_graded → faulty, as_shipped", () => {
    expect(outcomesFor("not_as_graded")).toEqual(["faulty", "as_shipped"]);
  });

  it("dead_on_arrival → 3 outcomes", () => {
    expect(outcomesFor("dead_on_arrival")).toEqual([
      "doa_confirmed",
      "doa_replacement",
      "as_shipped",
    ]);
  });

  it("buyer_changed_mind → changed_mind only", () => {
    expect(outcomesFor("buyer_changed_mind")).toEqual(["changed_mind"]);
  });
});

describe("validateOutcome", () => {
  it("throws on invalid combination", () => {
    expect(() => validateOutcome("buyer_changed_mind", "faulty")).toThrow();
  });

  it("does not throw on valid combination", () => {
    expect(() => validateOutcome("not_as_graded", "faulty")).not.toThrow();
  });
});

describe("escrow invariant", () => {
  it("refund + deduction = original for every return case", () => {
    for (const c of RETURN_CASES) {
      if (c.outcome === "doa_replacement") continue;
      const result = resolutionMath(c.order_total, c.outcome, DEFAULT_SETTINGS);
      expect(result.refund + result.deduction).toBe(c.order_total);
    }
  });
});
