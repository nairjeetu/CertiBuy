type Tone = "success" | "warning" | "destructive" | "neutral" | "info";

interface StatusDisplay {
  label: string;
  tone: Tone;
}

export const submissionStatuses: Record<string, StatusDisplay> = {
  draft: { label: "Draft", tone: "neutral" },
  graded: { label: "Graded", tone: "info" },
  offer_accepted: { label: "Offer accepted", tone: "success" },
  scheduled: { label: "Inspection booked", tone: "info" },
  inspected: { label: "Inspected", tone: "info" },
  accepted: { label: "Accepted", tone: "success" },
  rejected: { label: "Rejected", tone: "destructive" },
  abandoned: { label: "Abandoned", tone: "neutral" },
};

export const deviceStatuses: Record<string, StatusDisplay> = {
  in_refurbishment: { label: "In refurbishment", tone: "warning" },
  listed: { label: "Listed", tone: "success" },
  day45_review: { label: "Day 45 review", tone: "warning" },
  reserved: { label: "Reserved", tone: "info" },
  shipped: { label: "Shipped", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  settled: { label: "Settled", tone: "success" },
  returned: { label: "Returned", tone: "warning" },
  liquidated: { label: "Liquidated", tone: "neutral" },
};

export const listingStatuses: Record<string, StatusDisplay> = {
  active: { label: "Active", tone: "success" },
  reserved: { label: "Reserved", tone: "info" },
  sold: { label: "Sold", tone: "success" },
  review: { label: "Review", tone: "warning" },
  liquidated: { label: "Liquidated", tone: "neutral" },
  inactive: { label: "Inactive", tone: "neutral" },
};

export const orderStatuses: Record<string, StatusDisplay> = {
  pending: { label: "Pending payment", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  dispatched: { label: "Dispatched", tone: "info" },
  in_transit: { label: "In transit", tone: "info" },
  delivered: { label: "Delivered", tone: "success" },
  settled: { label: "Settled", tone: "success" },
  refunded: { label: "Refunded", tone: "warning" },
  replaced: { label: "Replaced", tone: "info" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

export const payoutStatuses: Record<string, StatusDisplay> = {
  due: { label: "Due", tone: "neutral" },
  pending: { label: "Pending", tone: "warning" },
  approved: { label: "Approved", tone: "info" },
  paid: { label: "Paid", tone: "success" },
  failed: { label: "Failed", tone: "destructive" },
};

export const escrowStatuses: Record<string, StatusDisplay> = {
  hold: { label: "Held in escrow", tone: "info" },
  released: { label: "Released", tone: "success" },
  refunded_full: { label: "Refunded in full", tone: "warning" },
  refunded_partial: { label: "Partially refunded", tone: "warning" },
  held_replacement: { label: "Held for replacement", tone: "info" },
};

export const returnStatuses: Record<string, StatusDisplay> = {
  awaiting_reinspection: { label: "Awaiting re-inspection", tone: "warning" },
  awaiting_decision: { label: "Awaiting decision", tone: "warning" },
  resolved: { label: "Resolved", tone: "success" },
};

export const gradeDisplay: Record<string, StatusDisplay> = {
  A: { label: "Grade A — Like new", tone: "success" },
  B: { label: "Grade B — Good", tone: "info" },
  C: { label: "Grade C — Fair", tone: "warning" },
  D: { label: "Grade D — Worn", tone: "neutral" },
};
