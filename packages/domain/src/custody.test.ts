import { describe, it, expect } from "vitest";
import { payoutPlan, orderTotal, cancelRefund } from "./custody.js";
import { DEFAULT_SETTINGS } from "../__fixtures__/settings.js";
import {
  PAYOUT_PLAN_CASES,
  ORDER_TOTAL_CASES,
  CANCEL_CASES,
} from "../__fixtures__/golden-cases.js";

describe("payoutPlan (golden cases)", () => {
  for (const c of PAYOUT_PLAN_CASES) {
    it(c.label, () => {
      const settings = { ...DEFAULT_SETTINGS, advance_pct: c.advance_pct };
      const result = payoutPlan(c.option, c.guaranteed_price, settings);
      expect(result.advance).toBe(c.expected_advance);
      expect(result.balance).toBe(c.expected_balance);
    });
  }

  it("advance + balance = guaranteed for sell_for_more", () => {
    const result = payoutPlan("sell_for_more", 46_550, DEFAULT_SETTINGS);
    expect(result.advance + result.balance).toBe(46_550);
  });
});

describe("orderTotal (golden cases)", () => {
  for (const c of ORDER_TOTAL_CASES) {
    it(c.label, () => {
      const settings = { ...DEFAULT_SETTINGS, warranty_addon_pct: c.warranty_addon_pct };
      const result = orderTotal(c.device_price, c.warranty_addon, c.warranty_months, settings);
      expect(result.warranty_addon_amount).toBe(c.expected_addon_amount);
      expect(result.total).toBe(c.expected_total);
    });
  }
});

describe("cancelRefund (golden cases)", () => {
  for (const c of CANCEL_CASES) {
    it(c.label, () => {
      const settings = { ...DEFAULT_SETTINGS, cancel_fee: c.cancel_fee };
      const result = cancelRefund(c.order_total, settings);
      expect(result.refund).toBe(c.expected_refund);
      expect(result.escrow_type).toBe(c.expected_escrow_type);
    });
  }

  it("default cancel_fee=0 gives full refund (§11.2)", () => {
    const result = cancelRefund(25_000, DEFAULT_SETTINGS);
    expect(DEFAULT_SETTINGS.cancel_fee).toBe(0);
    expect(result.refund).toBe(25_000);
    expect(result.deduction).toBe(0);
    expect(result.escrow_type).toBe("refund_full");
  });
});
