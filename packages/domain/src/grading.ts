import type { Settings, Submission, GradeAssessment } from "./types";
import type { Grade, ConfidenceLevel, RejectCode } from "@certibuy/contracts";
import { GRADE_ORDER, CONFIDENCE_NUMERIC } from "@certibuy/contracts";

const REJECT_COPY: Record<RejectCode, string> = {
  blacklisted_imei:
    "This IMEI has been reported blacklisted, so we can't buy this device.",
  activation_lock:
    "Activation lock is still on. Turn it off on the device, then run the checks again.",
  water_exposure:
    "Devices that have been exposed to water can't be bought, even after a repair.",
  other_shop_repair:
    "Repairs at a shop other than an authorised service centre can't be accepted.",
  invalid_imei:
    "That IMEI isn't valid. Check the 15 digits on the device or its box and enter them again.",
};

export interface RejectResult {
  rejected: true;
  code: RejectCode;
  reason: string;
}

export interface AssessResult {
  rejected: false;
  assessment: GradeAssessment;
}

export type GradeResult = RejectResult | AssessResult;

function luhnCheck(imei: string): boolean {
  let sum = 0;
  for (let i = 0; i < imei.length; i++) {
    let d = Number(imei[imei.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/** A well-formed IMEI: 15 digits whose Luhn check digit is correct. */
export function isValidImei(imei: string): boolean {
  return /^\d{15}$/.test(imei) && luhnCheck(imei);
}

export function checkRejects(
  submission: Submission,
  blacklisted: boolean,
): RejectResult | null {
  if (blacklisted) {
    return { rejected: true, code: "blacklisted_imei", reason: REJECT_COPY.blacklisted_imei };
  }
  const al = submission.diagnostics.activation_lock;
  if (al === "on" || al === "fail") {
    return { rejected: true, code: "activation_lock", reason: REJECT_COPY.activation_lock };
  }
  if (submission.water_exposure) {
    return { rejected: true, code: "water_exposure", reason: REJECT_COPY.water_exposure };
  }
  if (submission.repaired === "other_shop") {
    return { rejected: true, code: "other_shop_repair", reason: REJECT_COPY.other_shop_repair };
  }
  if (!isValidImei(submission.imei)) {
    return { rejected: true, code: "invalid_imei", reason: REJECT_COPY.invalid_imei };
  }
  return null;
}

function gradeIndex(g: Grade): number {
  return GRADE_ORDER.indexOf(g);
}

function worstGrade(...grades: Grade[]): Grade {
  let worst = 0;
  for (const g of grades) {
    const idx = gradeIndex(g);
    if (idx > worst) worst = idx;
  }
  return GRADE_ORDER[worst]!;
}

function oneBetter(g: Grade): Grade | null {
  const idx = gradeIndex(g);
  return idx > 0 ? (GRADE_ORDER[idx - 1] ?? null) : null;
}

function oneWorse(g: Grade): Grade | null {
  const idx = gradeIndex(g);
  return idx < GRADE_ORDER.length - 1 ? (GRADE_ORDER[idx + 1] ?? null) : null;
}

export function batteryGrade(health: number, settings: Settings): Grade {
  if (health >= settings.battery_a_min) return "A";
  if (health >= settings.battery_b_min) return "B";
  if (health >= settings.battery_c_min) return "C";
  return "D";
}

export function functionGrade(diagnostics: Submission["diagnostics"]): Grade {
  const checks = [
    diagnostics.battery,
    diagnostics.screen,
    diagnostics.speakers,
    diagnostics.microphone,
    diagnostics.cameras,
    diagnostics.charging,
    diagnostics.sensors,
  ];
  const anyFail = checks.some((c) => c === "fail");
  return anyFail ? "D" : "A";
}

export function confidenceLevel(
  repaired: Submission["repaired"],
  retakeCount: number,
  settings: Settings,
): ConfidenceLevel {
  if (repaired === "not_sure") return "Low";
  if (retakeCount > settings.photo_retake_medium) return "Medium";
  return "High";
}

export function computeBand(estimate: Grade, confidence: ConfidenceLevel): Grade[] {
  if (confidence === "Low") {
    const better = oneBetter(estimate);
    const worse = oneWorse(estimate);
    const band: Grade[] = [];
    if (better) band.push(better);
    band.push(estimate);
    if (worse) band.push(worse);
    return band;
  }

  // High or Medium: 2-grade band
  if (estimate === "A") return ["A", "B"];
  if (estimate === "D") return ["C", "D"];
  const better = oneBetter(estimate);
  return better ? [better, estimate] : [estimate];
}

export function assess(
  submission: Submission,
  settings: Settings,
): GradeAssessment {
  const batGrade = batteryGrade(submission.diagnostics.battery_health, settings);
  const funcGrade = functionGrade(submission.diagnostics);
  const cosGrade = submission.declared_cosmetic;

  const estimate = worstGrade(batGrade, cosGrade, funcGrade);
  const confidence = confidenceLevel(submission.repaired, submission.retake_count, settings);
  const band = computeBand(estimate, confidence);

  const factors: string[] = [];
  factors.push(
    `Battery health ${submission.diagnostics.battery_health}% → grade ${batGrade}`,
  );
  factors.push(`Cosmetic condition → grade ${cosGrade}`);
  if (funcGrade === "D") {
    factors.push("One or more diagnostic checks failed → grade D");
  } else {
    factors.push("All diagnostic checks passed → grade A");
  }
  if (confidence === "Medium") {
    factors.push(
      `Photos retaken ${submission.retake_count} times → confidence Medium`,
    );
  } else if (confidence === "Low") {
    factors.push("Repair history uncertain → confidence Low");
  }

  return {
    estimate,
    band,
    confidence,
    confidence_numeric: CONFIDENCE_NUMERIC[confidence],
    factors,
  };
}
