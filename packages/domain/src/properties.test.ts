import { describe, it } from "vitest";
import fc from "fast-check";
import { computeOffer } from "./pricing.js";
import { payoutPlan, cancelRefund } from "./custody.js";
import { resolutionMath } from "./returns.js";
import { computeBand } from "./grading.js";
import { ladderFor } from "./lifecycle.js";
import { businessDate } from "./business-date.js";
import { DEFAULT_SETTINGS } from "../__fixtures__/settings.js";
import type { Grade, ConfidenceLevel, ReturnOutcome } from "@certibuy/contracts";
import { GRADE_ORDER } from "@certibuy/contracts";

const gradeArb = fc.constantFrom<Grade>("A", "B", "C", "D");
const confArb = fc.constantFrom<ConfidenceLevel>("High", "Medium", "Low");

describe("property: payout ≤ guaranteed price", () => {
  it("instant cash ≤ guaranteed for any market price and risk", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 20_000, max: 150_000 }),
        fc.integer({ min: 1, max: 20 }),
        (market, risk) => {
          const result = computeOffer(market, risk, DEFAULT_SETTINGS);
          return result.instantCash <= result.guaranteed;
        },
      ),
    );
  });

  it("advance + balance = guaranteed for sell_for_more", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10_000, max: 200_000 }),
        (guaranteed) => {
          const plan = payoutPlan("sell_for_more", guaranteed, DEFAULT_SETTINGS);
          return plan.advance + plan.balance === guaranteed;
        },
      ),
    );
  });
});

describe("property: escrow movements sum to order total", () => {
  it("cancel refund + deduction = total", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1_000, max: 200_000 }),
        fc.integer({ min: 0, max: 5_000 }),
        (total, fee) => {
          const settings = { ...DEFAULT_SETTINGS, cancel_fee: fee };
          const result = cancelRefund(total, settings);
          return result.refund + result.deduction === total;
        },
      ),
    );
  });

  const refundOutcomes: ReturnOutcome[] = ["faulty", "as_shipped", "doa_confirmed", "changed_mind"];
  it("return refund + deduction = total", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1_000, max: 200_000 }),
        fc.constantFrom(...refundOutcomes),
        (total, outcome) => {
          const result = resolutionMath(total, outcome, DEFAULT_SETTINGS);
          return result.refund + result.deduction === total;
        },
      ),
    );
  });
});

describe("property: band shapes", () => {
  it("band is contiguous, 1-3 grades, includes estimate", () => {
    fc.assert(
      fc.property(gradeArb, confArb, (estimate, confidence) => {
        const band = computeBand(estimate, confidence);
        if (band.length < 1 || band.length > 3) return false;
        if (!band.includes(estimate)) return false;
        for (let i = 1; i < band.length; i++) {
          const prev = GRADE_ORDER.indexOf(band[i - 1]!);
          const curr = GRADE_ORDER.indexOf(band[i]!);
          if (curr - prev !== 1) return false;
        }
        return true;
      }),
    );
  });
});

describe("property: ladder never below floor", () => {
  it("price ≥ floor for any base/floor/day combination", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 20_000, max: 150_000 }),
        fc.integer({ min: 10_000, max: 100_000 }),
        fc.integer({ min: 0, max: 60 }),
        (base, floor, days) => {
          if (floor > base) return true;
          const listing = {
            id: "l",
            device_id: "d",
            base_price: base,
            current_price: base,
            floor_price: floor,
            ladder_step: 0,
            listed_at: "2026-01-01",
            reserved_days: 0,
            override_price: null,
            warranty_months: 12,
            status: "active" as const,
          };
          const today = `2026-${String(1 + Math.floor(days / 28)).padStart(2, "0")}-${String(1 + (days % 28)).padStart(2, "0")}`;
          const result = ladderFor(listing, DEFAULT_SETTINGS, today);
          return result.current_price >= floor;
        },
      ),
    );
  });
});

describe("property: business date format", () => {
  it("always yyyy-mm-dd", () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date("2020-01-01"), max: new Date("2030-12-31") }),
        fc.integer({ min: -365, max: 365 }),
        (date, offset) => {
          const settings = { ...DEFAULT_SETTINGS, sim_day_offset: offset };
          const result = businessDate(settings, date);
          return /^\d{4}-\d{2}-\d{2}$/.test(result);
        },
      ),
    );
  });
});
