import { z } from "zod";

// ─── Shared ──────────────────────────────────────────────────────────────────

const cuid = z.string().min(1);

// ─── Selling commands (S-01 … S-12) ─────────────────────────────────────────
// Amendment 4: no price/amount fields — IDs and choices only.

export const GradeSubmissionInput = z.object({
  submissionId: cuid,
});

export const ComputeOfferInput = z.object({
  submissionId: cuid,
  band: z.array(z.enum(["A", "B", "C", "D"])).optional(),
  confidence: z.enum(["High", "Medium", "Low"]).optional(),
});

export const IcEligibilityInput = z.object({
  modelId: cuid,
  confidence: z.enum(["High", "Medium", "Low"]).optional(),
});

export const AcceptOfferInput = z.object({
  submissionId: cuid,
  option: z.enum(["instant_cash", "sell_for_more"]),
  consent: z.literal(true),
});

export const ManageBookingInput = z.object({
  submissionId: cuid,
  action: z.enum(["switch_to_guaranteed", "cancel"]),
});

export const BookInspectionInput = z.object({
  submissionId: cuid,
  hubId: cuid,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slot: z.string().min(1),
});

// ─── Submission draft (save steps) ──────────────────────────────────────────

export const SaveSubmissionDetailsInput = z.object({
  submissionId: cuid.optional(),
  deviceModelId: cuid,
  imei: z.string().regex(/^\d{15}$/),
  declaredCosmetic: z.enum(["A", "B", "C", "D"]),
  repaired: z.enum(["no", "authorised", "other_shop", "not_sure"]),
  waterExposure: z.boolean(),
  colour: z.string().default(""),
  ageMonths: z.number().int().min(0).default(0),
  billBox: z.enum(["bill_and_box", "bill_only", "box_only", "neither"]).default("neither"),
  warrantyStatus: z.enum(["in_warranty", "expired", "unknown"]).default("unknown"),
});

export const SaveDiagnosticsInput = z.object({
  submissionId: cuid,
  diagnostics: z.object({
    battery: z.enum(["pass", "fail"]),
    screen: z.enum(["pass", "fail"]),
    speakers: z.enum(["pass", "fail"]),
    microphone: z.enum(["pass", "fail"]),
    cameras: z.enum(["pass", "fail"]),
    charging: z.enum(["pass", "fail"]),
    sensors: z.enum(["pass", "fail"]),
    imei_blacklist: z.enum(["pass", "fail"]),
    activation_lock: z.enum(["pass", "fail", "on", "off"]),
    battery_health: z.number().int().min(0).max(100),
  }),
});

// ─── IC ineligible reason labels ────────────────────────────────────────────

export const IC_REASON_COPY: Record<string, string> = {
  paused: "Instant Cash is paused for this model right now.",
  low_confidence: "We're not confident enough in the grade to offer Instant Cash.",
  low_liquidity: "This model isn't selling fast enough for Instant Cash right now.",
  launch_window: "A successor model launched recently, so Instant Cash is tighter.",
  inventory_cap: "Our overall Instant Cash budget is full right now.",
  model_cap: "We've hit our Instant Cash limit for this model.",
};

// ─── Hub / inspection commands (T-01 … T-07) ──────────────────────────────

const passFailItem = z.enum(["pass", "fail"]);

export const VerifyIdentityInput = z.object({
  submissionId: cuid,
  scannedImei: z.string().regex(/^\d{15}$/),
  activationLockOff: z.boolean(),
});

export const ConfirmGradeInput = z.object({
  submissionId: cuid,
  checklist: z.object({
    battery: passFailItem,
    screen: passFailItem,
    speakers: passFailItem,
    microphone: passFailItem,
    cameras: passFailItem,
    charging: passFailItem,
    sensors: passFailItem,
    wifi_bluetooth: passFailItem,
    buttons_ports: passFailItem,
  }),
  batteryHealth: z.number().int().min(50).max(100),
  cosmeticGrade: z.enum(["A", "B", "C", "D"]),
  photos: z.array(z.object({
    key: z.string().min(1),
    brightness: z.number(),
    ok: z.boolean(),
  })),
});

export const ReviseOfferInput = z.object({
  submissionId: cuid,
});

export const AcceptRevisedInput = z.object({
  submissionId: cuid,
});

export const DeclineRevisedInput = z.object({
  submissionId: cuid,
});

export const RejectForMismatchInput = z.object({
  submissionId: cuid,
  feePaid: z.boolean().default(false),
});

export const RejectDeviceInput = z.object({
  submissionId: cuid,
  reasonCode: z.string().min(1),
  note: z.string().optional(),
});

export const CompleteHandoverInput = z.object({
  submissionId: cuid,
  sealed: z.literal(true),
  tagId: z.string().regex(/^CB-\d{5}$/),
  signatureUrl: z.string().min(1),
});

// ─── Buying commands (B-05, B-07, B-09, B-12) ─────────────────────────────

export const PlaceOrderInput = z.object({
  listingId: cuid,
  deliveryName: z.string().min(2),
  deliveryPhone: z.string().regex(/^\d{10}$/),
  deliveryAddress: z.string().min(10),
  paymentMethod: z.enum(["upi", "card", "netbanking"]),
  warrantyAddon: z.boolean().default(false),
  declined: z.boolean().optional(),
});

export const CancelOrderInput = z.object({
  orderId: cuid,
  reason: z.string().optional(),
});

export const AdvanceShipmentInput = z.object({
  orderId: cuid,
});

export const RaiseReturnInput = z.object({
  orderId: cuid,
  reason: z.enum(["not_as_graded", "dead_on_arrival", "buyer_changed_mind"]),
  note: z.string().optional(),
  doaPreference: z.enum(["refund", "replacement"]).optional(),
  photos: z.array(z.object({ key: z.string().min(1) })).optional(),
});

export const ResolveReturnInput = z.object({
  returnId: cuid,
  outcome: z.enum(["faulty", "as_shipped", "doa_confirmed", "doa_replacement", "changed_mind"]),
  reason: z.string().optional(),
});

// ─── Seller view forbidden fields (amendment 5) ─────────────────────────────

export const SELLER_FORBIDDEN_FIELDS = [
  "commission",
  "commission_pct",
  "floor_price",
  "b2b_floor_price",
  "acquisition_cost",
  "buyer_id",
  "buyer_name",
  "buyer_phone",
  "buyer_address",
] as const;

// ─── Buyer view forbidden fields ────────────────────────────────────────────

export const BUYER_FORBIDDEN_FIELDS = [
  "seller_id",
  "acquisition_cost",
  "floor_price",
  "b2b_floor_price",
  "commission",
  "commission_pct",
  "payout_option",
  "custody_at",
] as const;
