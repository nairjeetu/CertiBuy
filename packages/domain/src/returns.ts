import type { Settings, ReturnRaiseMath, ReturnResolutionMath } from "./types.js";
import type { ReturnReason, ReturnOutcome } from "@certibuy/contracts";

const ALLOWED_OUTCOMES: Record<ReturnReason, ReturnOutcome[]> = {
  not_as_graded: ["faulty", "as_shipped"],
  dead_on_arrival: ["doa_confirmed", "doa_replacement", "as_shipped"],
  buyer_changed_mind: ["changed_mind"],
};

export function outcomesFor(reason: ReturnReason): ReturnOutcome[] {
  return ALLOWED_OUTCOMES[reason];
}

export function isValidOutcome(reason: ReturnReason, outcome: ReturnOutcome): boolean {
  return ALLOWED_OUTCOMES[reason].includes(outcome);
}

export function raiseMath(
  orderTotal: number,
  reason: ReturnReason,
  settings: Settings,
): ReturnRaiseMath {
  if (reason === "buyer_changed_mind") {
    return {
      original: orderTotal,
      deduction: settings.change_mind_fee,
      deduction_label: "change_of_mind",
      refund: orderTotal - settings.change_mind_fee,
    };
  }

  return {
    original: orderTotal,
    deduction: 0,
    deduction_label: null,
    refund: orderTotal,
  };
}

export function resolutionMath(
  orderTotal: number,
  outcome: ReturnOutcome,
  settings: Settings,
): ReturnResolutionMath {
  switch (outcome) {
    case "faulty":
    case "doa_confirmed":
      return {
        original: orderTotal,
        deduction: 0,
        deduction_label: null,
        refund: orderTotal,
        escrow_type: "refund_full",
      };

    case "as_shipped":
      return {
        original: orderTotal,
        deduction: settings.return_logistics_charge,
        deduction_label: "return_logistics",
        refund: orderTotal - settings.return_logistics_charge,
        escrow_type: "refund_partial",
      };

    case "changed_mind":
      return {
        original: orderTotal,
        deduction: settings.change_mind_fee,
        deduction_label: "change_of_mind",
        refund: orderTotal - settings.change_mind_fee,
        escrow_type: "refund_partial",
      };

    case "doa_replacement":
      return {
        original: orderTotal,
        deduction: 0,
        deduction_label: null,
        refund: 0,
        escrow_type: "refund_full",
      };
  }
}

export function validateOutcome(reason: ReturnReason, outcome: ReturnOutcome): void {
  if (!isValidOutcome(reason, outcome)) {
    throw new Error(`Outcome "${outcome}" is not allowed for reason "${reason}"`);
  }
}
