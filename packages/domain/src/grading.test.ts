import { describe, it, expect } from "vitest";
import { assess, checkRejects, computeBand } from "./grading.js";
import { DEFAULT_SETTINGS } from "../__fixtures__/settings.js";
import { GRADING_CASES } from "../__fixtures__/golden-cases.js";
import type { Submission, DiagnosticsResult } from "./types.js";
import type { Grade, ConfidenceLevel } from "@certibuy/contracts";
import { GRADE_ORDER } from "@certibuy/contracts";

function makeSubmission(overrides: {
  battery_health: number;
  declared_cosmetic: Grade;
  failed_checks: number;
  repaired: Submission["repaired"];
  retake_count: number;
}): Submission {
  const failKeys = ["screen", "speakers", "microphone", "cameras", "charging", "sensors", "battery"];
  const diag: DiagnosticsResult = {
    battery: "pass",
    screen: "pass",
    speakers: "pass",
    microphone: "pass",
    cameras: "pass",
    charging: "pass",
    sensors: "pass",
    imei_blacklist: "pass",
    activation_lock: "off",
    battery_health: overrides.battery_health,
  };
  for (let i = 0; i < overrides.failed_checks && i < failKeys.length; i++) {
    (diag as Record<string, string>)[failKeys[i]!] = "fail";
  }

  return {
    id: "sub-1",
    seller_id: "user-1",
    device_model_id: "model-1",
    imei: "490154203237518",
    declared_cosmetic: overrides.declared_cosmetic,
    repaired: overrides.repaired,
    water_exposure: false,
    diagnostics: diag,
    photos: [],
    retake_count: overrides.retake_count,
    category: "phone",
  };
}

describe("assess (golden cases)", () => {
  for (const c of GRADING_CASES) {
    it(c.label, () => {
      const sub = makeSubmission({
        battery_health: c.battery_health,
        declared_cosmetic: c.declared_cosmetic,
        failed_checks: c.failed_checks,
        repaired: c.repaired,
        retake_count: c.retake_count,
      });
      const result = assess(sub, DEFAULT_SETTINGS);
      expect(result.estimate).toBe(c.expected_estimate);
      expect(result.confidence).toBe(c.expected_confidence);
      expect(result.band.length).toBe(c.expected_band_length);
    });
  }
});

describe("band invariants", () => {
  const grades: Grade[] = ["A", "B", "C", "D"];
  const confidences: ConfidenceLevel[] = ["High", "Medium", "Low"];

  for (const estimate of grades) {
    for (const confidence of confidences) {
      it(`band for ${estimate}/${confidence} is contiguous and 1-3 grades`, () => {
        const band = computeBand(estimate, confidence);
        expect(band.length).toBeGreaterThanOrEqual(1);
        expect(band.length).toBeLessThanOrEqual(3);
        expect(band).toContain(estimate);

        for (let i = 1; i < band.length; i++) {
          const prev = GRADE_ORDER.indexOf(band[i - 1]!);
          const curr = GRADE_ORDER.indexOf(band[i]!);
          expect(curr - prev).toBe(1);
        }
      });
    }
  }

  it("A never yields a band below B", () => {
    for (const conf of confidences) {
      const band = computeBand("A", conf);
      expect(band.every((g) => g === "A" || g === "B")).toBe(true);
    }
  });

  it("D never yields a band above C", () => {
    for (const conf of confidences) {
      const band = computeBand("D", conf);
      expect(band.every((g) => g === "C" || g === "D")).toBe(true);
    }
  });
});

describe("checkRejects", () => {
  it("rejects blacklisted IMEI first", () => {
    const sub = makeSubmission({
      battery_health: 95,
      declared_cosmetic: "A",
      failed_checks: 0,
      repaired: "no",
      retake_count: 0,
    });
    const result = checkRejects({ ...sub, water_exposure: true }, true);
    expect(result?.code).toBe("blacklisted_imei");
  });

  it("rejects activation lock second", () => {
    const sub = makeSubmission({
      battery_health: 95,
      declared_cosmetic: "A",
      failed_checks: 0,
      repaired: "no",
      retake_count: 0,
    });
    sub.diagnostics.activation_lock = "on";
    const result = checkRejects(sub, false);
    expect(result?.code).toBe("activation_lock");
  });

  it("rejects water exposure third", () => {
    const sub = makeSubmission({
      battery_health: 95,
      declared_cosmetic: "A",
      failed_checks: 0,
      repaired: "no",
      retake_count: 0,
    });
    sub.water_exposure = true;
    const result = checkRejects(sub, false);
    expect(result?.code).toBe("water_exposure");
  });

  it("rejects other_shop repair fourth", () => {
    const sub = makeSubmission({
      battery_health: 95,
      declared_cosmetic: "A",
      failed_checks: 0,
      repaired: "other_shop",
      retake_count: 0,
    });
    const result = checkRejects(sub, false);
    expect(result?.code).toBe("other_shop_repair");
  });

  it("rejects invalid IMEI", () => {
    const sub = makeSubmission({
      battery_health: 95,
      declared_cosmetic: "A",
      failed_checks: 0,
      repaired: "no",
      retake_count: 0,
    });
    sub.imei = "12345";
    const result = checkRejects(sub, false);
    expect(result?.code).toBe("invalid_imei");
  });

  it("passes when everything is ok", () => {
    const sub = makeSubmission({
      battery_health: 95,
      declared_cosmetic: "A",
      failed_checks: 0,
      repaired: "no",
      retake_count: 0,
    });
    const result = checkRejects(sub, false);
    expect(result).toBeNull();
  });
});
