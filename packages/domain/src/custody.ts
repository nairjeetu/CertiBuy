import type { Settings, PayoutPlan, OrderTotalResult, CancelRefundResult } from "./types";
import type { EscrowType } from "@certibuy/contracts";

export function payoutPlan(
  option: "instant_cash" | "sell_for_more",
  amount: number,
  settings: Settings,
): PayoutPlan {
  if (option === "instant_cash") {
    return { advance: amount, balance: 0, balance_trigger: "buyer_paid_escrow" };
  }

  const advance = Math.round(amount * settings.advance_pct / 100);
  const balance = amount - advance;
  return {
    advance,
    balance,
    balance_trigger: "day_21_unsold",
  };
}

export function orderTotal(
  devicePrice: number,
  warrantyAddon: boolean,
  warrantyMonths: number,
  settings: Settings,
): OrderTotalResult {
  const addonAllowed = warrantyAddon && warrantyMonths > 0;
  const addonAmount = addonAllowed
    ? Math.round(devicePrice * settings.warranty_addon_pct / 100)
    : 0;

  return {
    device_price: devicePrice,
    warranty_addon: addonAllowed,
    warranty_addon_amount: addonAmount,
    total: devicePrice + addonAmount,
  };
}

export function cancelRefund(
  orderTotal: number,
  settings: Settings,
): CancelRefundResult {
  const deduction = settings.cancel_fee;
  const refund = orderTotal - deduction;
  const escrowType: EscrowType = deduction === 0 ? "refund_full" : "refund_partial";
  return { refund, deduction, escrow_type: escrowType };
}
