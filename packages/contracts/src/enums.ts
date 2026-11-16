export const Grade = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
} as const;
export type Grade = (typeof Grade)[keyof typeof Grade];

export const GRADE_ORDER: readonly Grade[] = ["A", "B", "C", "D"] as const;

export const PayoutOption = {
  instant_cash: "instant_cash",
  sell_for_more: "sell_for_more",
} as const;
export type PayoutOption = (typeof PayoutOption)[keyof typeof PayoutOption];

export const PayoutType = {
  instant_cash_full: "instant_cash_full",
  advance: "advance",
  balance: "balance",
  mismatch_fee: "mismatch_fee",
} as const;
export type PayoutType = (typeof PayoutType)[keyof typeof PayoutType];

export const PayoutStatus = {
  due: "due",
  pending: "pending",
  approved: "approved",
  paid: "paid",
  failed: "failed",
} as const;
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus];

export const ConfidenceLevel = {
  High: "High",
  Medium: "Medium",
  Low: "Low",
} as const;
export type ConfidenceLevel =
  (typeof ConfidenceLevel)[keyof typeof ConfidenceLevel];

export const CONFIDENCE_NUMERIC: Record<ConfidenceLevel, number> = {
  High: 90,
  Medium: 70,
  Low: 45,
};

export const Verdict = {
  inside: "inside",
  one_below: "one_below",
  two_below: "two_below",
} as const;
export type Verdict = (typeof Verdict)[keyof typeof Verdict];

export const RejectCode = {
  blacklisted_imei: "blacklisted_imei",
  activation_lock: "activation_lock",
  water_exposure: "water_exposure",
  other_shop_repair: "other_shop_repair",
  invalid_imei: "invalid_imei",
} as const;
export type RejectCode = (typeof RejectCode)[keyof typeof RejectCode];

export const SubmissionStatus = {
  draft: "draft",
  graded: "graded",
  offer_accepted: "offer_accepted",
  scheduled: "scheduled",
  inspected: "inspected",
  accepted: "accepted",
  rejected: "rejected",
  abandoned: "abandoned",
} as const;
export type SubmissionStatus =
  (typeof SubmissionStatus)[keyof typeof SubmissionStatus];

export const DeviceStatus = {
  in_refurbishment: "in_refurbishment",
  listed: "listed",
  day45_review: "day45_review",
  reserved: "reserved",
  shipped: "shipped",
  delivered: "delivered",
  settled: "settled",
  returned: "returned",
  liquidated: "liquidated",
} as const;
export type DeviceStatus = (typeof DeviceStatus)[keyof typeof DeviceStatus];

export const ListingStatus = {
  active: "active",
  reserved: "reserved",
  sold: "sold",
  review: "review",
  liquidated: "liquidated",
  inactive: "inactive",
} as const;
export type ListingStatus =
  (typeof ListingStatus)[keyof typeof ListingStatus];

export const OrderStatus = {
  pending: "pending",
  paid: "paid",
  dispatched: "dispatched",
  in_transit: "in_transit",
  delivered: "delivered",
  settled: "settled",
  refunded: "refunded",
  replaced: "replaced",
  cancelled: "cancelled",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const EscrowType = {
  hold: "hold",
  release: "release",
  refund_full: "refund_full",
  refund_partial: "refund_partial",
} as const;
export type EscrowType = (typeof EscrowType)[keyof typeof EscrowType];

export const EscrowStatus = {
  hold: "hold",
  released: "released",
  refunded_full: "refunded_full",
  refunded_partial: "refunded_partial",
  held_replacement: "held_replacement",
} as const;
export type EscrowStatus = (typeof EscrowStatus)[keyof typeof EscrowStatus];

export const ReturnReason = {
  not_as_graded: "not_as_graded",
  dead_on_arrival: "dead_on_arrival",
  buyer_changed_mind: "buyer_changed_mind",
} as const;
export type ReturnReason = (typeof ReturnReason)[keyof typeof ReturnReason];

export const ReturnOutcome = {
  faulty: "faulty",
  as_shipped: "as_shipped",
  doa_confirmed: "doa_confirmed",
  doa_replacement: "doa_replacement",
  changed_mind: "changed_mind",
} as const;
export type ReturnOutcome =
  (typeof ReturnOutcome)[keyof typeof ReturnOutcome];

export const BookingStatus = {
  booked: "booked",
  completed: "completed",
  cancelled: "cancelled",
  no_show: "no_show",
} as const;
export type BookingStatus =
  (typeof BookingStatus)[keyof typeof BookingStatus];

export const ReturnStatus = {
  awaiting_reinspection: "awaiting_reinspection",
  awaiting_decision: "awaiting_decision",
  resolved: "resolved",
} as const;
export type ReturnStatus = (typeof ReturnStatus)[keyof typeof ReturnStatus];

export const IcIneligibleReason = {
  paused: "paused",
  low_confidence: "low_confidence",
  low_liquidity: "low_liquidity",
  launch_window: "launch_window",
  inventory_cap: "inventory_cap",
  model_cap: "model_cap",
} as const;
export type IcIneligibleReason =
  (typeof IcIneligibleReason)[keyof typeof IcIneligibleReason];

export const AppRole = {
  customer: "customer",
  technician: "technician",
  ops: "ops",
} as const;
export type AppRole = (typeof AppRole)[keyof typeof AppRole];

export const ActiveMode = {
  buyer: "buyer",
  seller: "seller",
} as const;
export type ActiveMode = (typeof ActiveMode)[keyof typeof ActiveMode];

export const Category = {
  phone: "phone",
  laptop: "laptop",
  tablet: "tablet",
  watch: "watch",
} as const;
export type Category = (typeof Category)[keyof typeof Category];

export const PHOTOS_REQUIRED: Record<Category, number> = {
  phone: 8,
  laptop: 5,
  tablet: 5,
  watch: 5,
};

export const PaymentMethod = {
  upi: "upi",
  card: "card",
  netbanking: "netbanking",
} as const;
export type PaymentMethod =
  (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const SupportTopic = {
  selling_device: "selling_device",
  order_delivery: "order_delivery",
  return_refund: "return_refund",
  payments: "payments",
  other: "other",
} as const;
export type SupportTopic =
  (typeof SupportTopic)[keyof typeof SupportTopic];

export const ExceptionType = {
  return: "return",
  failed_inspection: "failed_inspection",
  grade_dispute: "grade_dispute",
  payment_hold: "payment_hold",
} as const;
export type ExceptionType =
  (typeof ExceptionType)[keyof typeof ExceptionType];

export const LiquidityTier = {
  high: "high",
  medium: "medium",
  low: "low",
} as const;
export type LiquidityTier =
  (typeof LiquidityTier)[keyof typeof LiquidityTier];

export const TIER_COLD_START_SCORE: Record<LiquidityTier, number> = {
  high: 80,
  medium: 65,
  low: 45,
};
