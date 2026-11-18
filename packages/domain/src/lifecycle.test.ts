import { describe, it, expect } from "vitest";
import { ladderFor, nextPayoutState, transitionDevice, transitionListing, transitionOrder } from "./lifecycle.js";
import { DEFAULT_SETTINGS } from "../__fixtures__/settings.js";
import { LADDER_CASES, PAYOUT_MACHINE_CASES } from "../__fixtures__/golden-cases.js";
import type { Listing, PayoutRecord } from "./types.js";
import type { PayoutStatus } from "@certibuy/contracts";

import { addDays } from "./business-date.js";

function makeListing(overrides: Partial<Listing> & { base_price: number; floor_price: number; listed_at: string }): Listing {
  return {
    id: "listing-1",
    device_id: "device-1",
    base_price: overrides.base_price,
    current_price: overrides.base_price,
    floor_price: overrides.floor_price,
    ladder_step: 0,
    listed_at: overrides.listed_at,
    reserved_days: overrides.reserved_days ?? 0,
    override_price: overrides.override_price ?? null,
    warranty_months: overrides.warranty_months ?? 12,
    status: overrides.status ?? "active",
  };
}

describe("ladderFor (golden cases)", () => {
  for (const c of LADDER_CASES) {
    it(c.label, () => {
      const listing = makeListing({
        base_price: c.base_price,
        floor_price: c.floor_price,
        listed_at: "2026-10-01",
        override_price: c.override_price,
      });
      const settings = { ...DEFAULT_SETTINGS, step1_pct: c.step1_pct, step2_pct: c.step2_pct };

      const today = addDays("2026-10-01", c.days_listed);
      const result = ladderFor(listing, settings, today);

      expect(result.current_price).toBe(c.expected_price);
      expect(result.ladder_step).toBe(c.expected_step);
      expect(result.at_review).toBe(c.expected_at_review);
    });
  }

  it("reserved days are subtracted from days_listed", () => {
    const listing = makeListing({
      base_price: 55_000,
      floor_price: 25_000,
      listed_at: "2026-10-01",
      reserved_days: 5,
    });
    const result = ladderFor(listing, DEFAULT_SETTINGS, "2026-10-19");
    expect(result.days_listed).toBe(13);
    expect(result.ladder_step).toBe(0);
  });
});

describe("payout state machine (golden cases)", () => {
  for (const c of PAYOUT_MACHINE_CASES) {
    it(c.label, () => {
      const payout: PayoutRecord = {
        id: "payout-1",
        type: "advance",
        amount: 23_275,
        status: c.current_status as PayoutStatus,
        attempts: c.current_attempts,
        failure_reason: "",
      };
      const settings = { ...DEFAULT_SETTINGS, payout_max_attempts: c.max_attempts };
      const result = nextPayoutState(payout, { success: c.attempt_success }, settings, "2026-11-17T10:00:00.000Z");

      expect(result.new_status).toBe(c.expected_new_status);
      expect(result.open_exception).toBe(c.expected_open_exception);
    });
  }

  it("paid_at is the caller-supplied timestamp, not wall clock", () => {
    const payout: PayoutRecord = {
      id: "payout-fixed",
      type: "advance",
      amount: 10_000,
      status: "approved",
      attempts: 0,
      failure_reason: "",
    };
    const fixedNow = "2026-06-15T14:30:00.000Z";
    const result = nextPayoutState(payout, { success: true }, DEFAULT_SETTINGS, fixedNow);
    expect(result.paid_at).toBe(fixedNow);
  });
});

describe("transition tables", () => {
  it("allows legal device transition", () => {
    expect(() => transitionDevice("listed", "reserved")).not.toThrow();
  });

  it("rejects illegal device transition", () => {
    expect(() => transitionDevice("settled", "listed")).toThrow("Illegal device transition");
  });

  it("allows legal listing transition", () => {
    expect(() => transitionListing("active", "reserved")).not.toThrow();
  });

  it("allows sold → active for relisting", () => {
    expect(() => transitionListing("sold", "active")).not.toThrow();
  });

  it("rejects illegal listing transition", () => {
    expect(() => transitionListing("sold", "reserved")).toThrow("Illegal listing transition");
  });

  it("allows legal order transition", () => {
    expect(() => transitionOrder("paid", "dispatched")).not.toThrow();
    expect(() => transitionOrder("paid", "cancelled")).not.toThrow();
  });

  it("rejects illegal order transition", () => {
    expect(() => transitionOrder("dispatched", "cancelled")).toThrow("Illegal order transition");
  });
});
