import type { Settings, InspectionInput, InspectionResult } from "./types";
import type { Grade } from "@certibuy/contracts";
import { GRADE_ORDER } from "@certibuy/contracts";
import { batteryGrade } from "./grading";

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

export function techFunctionGrade(failedCount: number): Grade {
  if (failedCount === 0) return "A";
  if (failedCount === 1) return "B";
  if (failedCount === 2) return "C";
  return "D";
}

export function confirmGrade(
  input: InspectionInput,
  aiBand: Grade[],
  settings: Settings,
): InspectionResult {
  const batGrade = batteryGrade(input.battery_health, settings);

  const failedCount = Object.values(input.checklist).filter(
    (v) => v === "fail",
  ).length;
  const funcGrade = techFunctionGrade(failedCount);

  const finalGrade = worstGrade(batGrade, input.cosmetic_grade, funcGrade);

  const lowestBandIndex = Math.max(...aiBand.map(gradeIndex));
  const finalIndex = gradeIndex(finalGrade);
  const diff = finalIndex - lowestBandIndex;

  let verdict: InspectionResult["verdict"];
  if (diff <= 0) {
    verdict = "inside";
  } else if (diff === 1) {
    verdict = "one_below";
  } else {
    verdict = "two_below";
  }

  return {
    component_grades: {
      battery: batGrade,
      cosmetic: input.cosmetic_grade,
      functions: funcGrade,
    },
    final_grade: finalGrade,
    verdict,
  };
}
