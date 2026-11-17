import type {
  Settings,
  Listing,
  LadderResult,
  PayoutRecord,
  PayoutAttemptResult,
  PayoutTransition,
} from "./types";
import type {
  DeviceStatus,
  ListingStatus,
  OrderStatus,
} from "@certibuy/contracts";
import { roundToTen } from "./money";
import { diffDays } from "./business-date";

// --- Price ladder ---

export function ladderFor(
  listing: Listing,
  settings: Settings,
  today: string,
): LadderResult {
  const daysRaw = diffDays(listing.listed_at, today);
  const daysListed = Math.max(0, daysRaw - listing.reserved_days);

  const atReview = daysListed >= settings.review_day;

  let step: number;
  if (daysListed >= settings.step2_day) {
    step = 2;
  } else if (daysListed >= settings.step1_day) {
    step = 1;
  } else {
    step = 0;
  }

  if (listing.override_price != null) {
    return {
      current_price: listing.override_price,
      ladder_step: step,
      days_listed: daysListed,
      at_review: atReview,
    };
  }

  let price: number;
  switch (step) {
    case 2:
      price = roundToTen(listing.base_price * (1 - settings.step2_pct / 100));
      break;
    case 1:
      price = roundToTen(listing.base_price * (1 - settings.step1_pct / 100));
      break;
    default:
      price = listing.base_price;
  }

  price = Math.max(price, listing.floor_price);

  return {
    current_price: price,
    ladder_step: step,
    days_listed: daysListed,
    at_review: atReview,
  };
}

// --- Payout state machine ---

export function nextPayoutState(
  payout: PayoutRecord,
  result: PayoutAttemptResult,
  settings: Settings,
  now: string,
): PayoutTransition {
  const newAttempts = payout.attempts + 1;

  if (result.success) {
    return {
      new_status: "paid",
      open_exception: false,
      paid_at: now,
    };
  }

  if (newAttempts >= settings.payout_max_attempts) {
    return {
      new_status: "failed",
      open_exception: true,
      paid_at: null,
    };
  }

  return {
    new_status: "approved",
    open_exception: false,
    paid_at: null,
  };
}

// --- Device transitions ---

const DEVICE_TRANSITIONS: Record<DeviceStatus, DeviceStatus[]> = {
  in_refurbishment: ["listed"],
  listed: ["reserved", "day45_review"],
  day45_review: ["listed", "liquidated"],
  reserved: ["shipped", "listed"],
  shipped: ["delivered"],
  delivered: ["settled", "returned"],
  settled: [],
  returned: ["in_refurbishment", "listed"],
  liquidated: [],
};

export function transitionDevice(
  from: DeviceStatus,
  to: DeviceStatus,
): void {
  const allowed = DEVICE_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new Error(`Illegal device transition: ${from} → ${to}`);
  }
}

// --- Listing transitions ---

const LISTING_TRANSITIONS: Record<ListingStatus, ListingStatus[]> = {
  active: ["reserved", "review", "inactive"],
  reserved: ["active", "sold"],
  sold: [],
  review: ["active", "liquidated", "inactive"],
  liquidated: [],
  inactive: ["active"],
};

export function transitionListing(
  from: ListingStatus,
  to: ListingStatus,
): void {
  const allowed = LISTING_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new Error(`Illegal listing transition: ${from} → ${to}`);
  }
}

// --- Order transitions ---

const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["dispatched", "cancelled"],
  dispatched: ["in_transit"],
  in_transit: ["delivered"],
  delivered: ["settled", "refunded", "replaced"],
  settled: [],
  refunded: [],
  replaced: [],
  cancelled: [],
};

export function transitionOrder(
  from: OrderStatus,
  to: OrderStatus,
): void {
  const allowed = ORDER_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new Error(`Illegal order transition: ${from} → ${to}`);
  }
}
