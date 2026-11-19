import { prisma } from "@certibuy/db";
import {
  businessDate,
  diffDays,
  cancelRefund,
  raiseMath,
  outcomesFor,
} from "@certibuy/domain";
import { orderStatuses, escrowStatuses, returnStatuses } from "@certibuy/contracts";
import type { Actor } from "../actor";
import { requireRole, requireOwner } from "../policy";

async function readSettings() {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!s) throw new Error("Settings are missing.");
  return s;
}

// ─── B-01: getShopHome ─────────────────────────────────────────────────────

export async function getShopHome(actor: Actor) {
  requireRole(actor, "customer");

  const listingInclude = {
    device: {
      select: {
        id: true,
        final_grade: true,
        device_model_id: true,
        device_model: { select: { brand: true, model: true, storage: true, category: true, image_url: true } },
      },
    },
  } as const;

  const newest = await prisma.listing.findMany({
    where: { status: "active" },
    orderBy: { created_at: "desc" },
    take: 8,
    include: listingInclude,
  });

  const gradeAPicks = await prisma.listing.findMany({
    where: { status: "active", device: { final_grade: "A" } },
    orderBy: { created_at: "desc" },
    take: 4,
    include: listingInclude,
  });

  const totalActive = await prisma.listing.count({ where: { status: "active" } });

  const toCard = (l: typeof newest[number]) => ({
    listingId: l.id,
    brand: l.device.device_model.brand,
    model: l.device.device_model.model,
    storage: l.device.device_model.storage,
    category: l.device.device_model.category,
    imageUrl: l.device.device_model.image_url,
    grade: l.device.final_grade,
    currentPrice: l.current_price,
    warrantyMonths: l.warranty_months,
  });

  return {
    newest: newest.map(toCard),
    gradeAPicks: gradeAPicks.map(toCard),
    totalActive,
  };
}

// ─── B-02: getShopCatalogue ────────────────────────────────────────────────

export async function getShopCatalogue(
  actor: Actor,
  params: Record<string, string>,
  _now: Date,
) {
  requireRole(actor, "customer");

  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(params.limit) || 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { status: "active" };
  const deviceWhere: Record<string, unknown> = {};

  if (params.brand) deviceWhere.device_model = { ...((deviceWhere.device_model as object) ?? {}), brand: params.brand };
  if (params.grade) deviceWhere.final_grade = params.grade;
  if (Object.keys(deviceWhere).length > 0) where.device = deviceWhere;
  if (params.priceMin) where.current_price = { ...((where.current_price as object) ?? {}), gte: Number(params.priceMin) };
  if (params.priceMax) where.current_price = { ...((where.current_price as object) ?? {}), lte: Number(params.priceMax) };

  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: params.sort === "price_asc" ? { current_price: "asc" }
        : params.sort === "price_desc" ? { current_price: "desc" }
        : { created_at: "desc" },
      skip,
      take: limit,
      include: {
        device: {
          include: {
            device_model: { select: { brand: true, model: true, storage: true, category: true, image_url: true } },
            hub: { select: { city: true } },
          },
        },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  const brands = await prisma.deviceModel.findMany({ select: { brand: true }, distinct: ["brand"] });
  const storages = await prisma.deviceModel.findMany({ select: { storage: true }, distinct: ["storage"] });

  return {
    items: items.map((l) => ({
      listingId: l.id,
      brand: l.device.device_model.brand,
      model: l.device.device_model.model,
      storage: l.device.device_model.storage,
      category: l.device.device_model.category,
      imageUrl: l.device.device_model.image_url,
      grade: l.device.final_grade,
      currentPrice: l.current_price,
      warrantyMonths: l.warranty_months,
      hubCity: l.device.hub.city,
      listedAt: l.listed_at,
    })),
    total,
    page,
    limit,
    facets: {
      brands: brands.map((b) => b.brand),
      storages: storages.map((s) => s.storage),
    },
  };
}

// ─── B-03: getListingDetail ────────────────────────────────────────────────

export async function getListingDetail(actor: Actor, listingId: string) {
  requireRole(actor, "customer");
  if (!listingId) throw new Error("listingId is required.");

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      device: {
        include: {
          device_model: true,
          hub: { select: { name: true, city: true } },
        },
      },
    },
  });
  if (!listing) throw new Error("Listing not found.");

  const report = await prisma.inspectionReport.findFirst({
    where: { submission_id: listing.device.submission_id, type: "intake", sealed: true },
  });

  const settings = await readSettings();

  const siblingListings = await prisma.listing.findMany({
    where: {
      status: "active",
      device: { device_model_id: listing.device.device_model_id },
    },
    select: { id: true, current_price: true, device: { select: { final_grade: true } } },
  });

  const gradeStrip = siblingListings.map((sl) => ({
    grade: sl.device.final_grade,
    price: sl.current_price,
    listingId: sl.id,
  })).sort((a, b) => a.grade.localeCompare(b.grade));

  return {
    listingId: listing.id,
    brand: listing.device.device_model.brand,
    model: listing.device.device_model.model,
    storage: listing.device.device_model.storage,
    category: listing.device.device_model.category,
    grade: listing.device.final_grade,
    currentPrice: listing.current_price,
    basePrice: listing.base_price,
    warrantyMonths: listing.warranty_months,
    hubName: listing.device.hub.name,
    hubCity: listing.device.hub.city,
    status: listing.status,
    gradeStrip,
    inspection: report ? {
      checklist: report.checklist,
      batteryHealth: report.battery_health,
      cosmeticGrade: report.cosmetic_grade,
      computedGrade: report.computed_grade,
    } : null,
    returnWindowDays: settings.return_window_days,
  };
}

// ─── B-05: getCheckout ─────────────────────────────────────────────────────

export async function getCheckout(actor: Actor, listingId: string) {
  requireRole(actor, "customer");
  if (!listingId) throw new Error("listingId is required.");

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      device: {
        include: { device_model: { select: { brand: true, model: true, storage: true } } },
      },
    },
  });
  if (!listing) throw new Error("Listing not found.");

  const profile = await prisma.profile.findUnique({
    where: { id: actor.id },
    select: { full_name: true, phone: true, delivery_address: true },
  });

  const settings = await readSettings();
  const addonPrice = listing.warranty_months > 0
    ? Math.round(listing.current_price * settings.warranty_addon_pct / 100)
    : 0;

  return {
    listingId: listing.id,
    brand: listing.device.device_model.brand,
    model: listing.device.device_model.model,
    storage: listing.device.device_model.storage,
    grade: listing.device.final_grade,
    currentPrice: listing.current_price,
    warrantyMonths: listing.warranty_months,
    warrantyAddonPrice: addonPrice,
    addonAllowed: listing.warranty_months > 0,
    deliveryDefaults: {
      name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      address: profile?.delivery_address ?? "",
    },
    paymentMethods: ["upi", "card", "netbanking"],
    returnWindowDays: settings.return_window_days,
    available: listing.status === "active",
  };
}

// ─── B-04: getShopGrades ───────────────────────────────────────────────────

export async function getShopGrades(actor: Actor) {
  requireRole(actor, "customer");
  const settings = await readSettings();

  return {
    grades: [
      { grade: "A", label: "Like new", description: "Minimal signs of use. Battery above " + settings.battery_a_min + "%.", batteryMin: settings.battery_a_min },
      { grade: "B", label: "Good", description: "Light wear, fully functional. Battery above " + settings.battery_b_min + "%.", batteryMin: settings.battery_b_min },
      { grade: "C", label: "Fair", description: "Visible wear, all features work. Battery above " + settings.battery_c_min + "%.", batteryMin: settings.battery_c_min },
      { grade: "D", label: "Refurbished", description: "Repaired and tested. Listed with no warranty.", batteryMin: 0 },
    ],
  };
}

// ─── B-08: getMyOrders ─────────────────────────────────────────────────────

export async function getMyOrders(actor: Actor) {
  requireRole(actor, "customer");

  const orders = await prisma.order.findMany({
    where: { buyer_id: actor.id },
    orderBy: { created_at: "desc" },
    include: {
      device: {
        include: { device_model: { select: { brand: true, model: true, storage: true } } },
      },
      return_requests: { where: { status: { not: "resolved" } }, take: 1 },
    },
  });

  return {
    items: orders.map((o) => {
      const status = orderStatuses[o.status] ?? { label: o.status, tone: "neutral" };
      return {
        orderId: o.id,
        status: o.status,
        statusLabel: status.label,
        statusTone: status.tone,
        brand: o.device.device_model.brand,
        model: o.device.device_model.model,
        storage: o.device.device_model.storage,
        grade: o.device.final_grade,
        total: o.total,
        createdAt: o.created_at.toISOString(),
        hasOpenReturn: o.return_requests.length > 0,
      };
    }),
  };
}

// ─── B-07: getOrderTracking ────────────────────────────────────────────────

export async function getOrderTracking(actor: Actor, orderId: string, now: Date) {
  requireRole(actor, "customer");
  if (!orderId) throw new Error("orderId is required.");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      device: {
        include: { device_model: { select: { brand: true, model: true, storage: true } } },
      },
      return_requests: { orderBy: { created_at: "desc" }, take: 1 },
    },
  });
  if (!order) throw new Error("Order not found.");
  requireOwner(actor, order.buyer_id);

  const settings = await readSettings();
  const bDate = businessDate(settings, now);

  const shipments = await prisma.shipment.findMany({
    where: { order_id: orderId },
    orderBy: { created_at: "asc" },
  });

  const canCancel = order.status === "pending" || order.status === "paid";
  const cancelEstimate = canCancel ? cancelRefund(order.total, settings) : null;

  let returnDaysLeft: number | null = null;
  if (order.return_window_closes_at) {
    const closesAt = order.return_window_closes_at.toISOString().slice(0, 10);
    returnDaysLeft = Math.max(0, diffDays(bDate, closesAt));
  }

  const openReturn = order.return_requests[0] ?? null;
  const status = orderStatuses[order.status] ?? { label: order.status, tone: "neutral" };

  return {
    orderId: order.id,
    status: order.status,
    statusLabel: status.label,
    statusTone: status.tone,
    brand: order.device.device_model.brand,
    model: order.device.device_model.model,
    storage: order.device.device_model.storage,
    grade: order.device.final_grade,
    total: order.total,
    devicePrice: order.device_price,
    warrantyAddonAmount: order.warranty_addon_amount,
    paymentMethod: order.payment_method,
    paidAt: order.paid_at?.toISOString() ?? null,
    deliveredAt: order.delivered_at?.toISOString() ?? null,
    returnWindowClosesAt: order.return_window_closes_at?.toISOString() ?? null,
    returnDaysLeft,
    escrowStatus: order.escrow_status,
    escrowLabel: (escrowStatuses[order.escrow_status] ?? { label: order.escrow_status }).label,
    refundAmount: order.refund_amount,
    timeline: shipments.map((s) => ({
      status: s.status,
      notes: s.notes,
      createdAt: s.created_at.toISOString(),
    })),
    canCancel,
    cancelEstimate: cancelEstimate ? { refund: cancelEstimate.refund, deduction: cancelEstimate.deduction } : null,
    canReturn: (order.status === "delivered" || order.status === "settled") && (returnDaysLeft ?? 0) > 0 && !openReturn,
    openReturn: openReturn ? {
      id: openReturn.id,
      status: openReturn.status,
      statusLabel: (returnStatuses[openReturn.status] ?? { label: openReturn.status }).label,
      reason: openReturn.reason,
      outcome: openReturn.outcome,
      refundAmount: openReturn.refund_amount,
    } : null,
  };
}

// ─── B-06: getOrderReceipt ─────────────────────────────────────────────────

export async function getOrderReceipt(actor: Actor, orderId: string) {
  requireRole(actor, "customer");
  if (!orderId) throw new Error("orderId is required.");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      device: {
        include: { device_model: { select: { brand: true, model: true, storage: true } } },
      },
    },
  });
  if (!order) throw new Error("Order not found.");
  requireOwner(actor, order.buyer_id);

  return {
    orderId: order.id,
    brand: order.device.device_model.brand,
    model: order.device.device_model.model,
    storage: order.device.device_model.storage,
    grade: order.device.final_grade,
    devicePrice: order.device_price,
    warrantyAddon: order.warranty_addon,
    warrantyAddonAmount: order.warranty_addon_amount,
    total: order.total,
    paymentMethod: order.payment_method,
    escrowStatus: order.escrow_status,
    escrowLabel: (escrowStatuses[order.escrow_status] ?? { label: order.escrow_status }).label,
    paidAt: order.paid_at?.toISOString() ?? null,
    returnWindowClosesAt: order.return_window_closes_at?.toISOString() ?? null,
  };
}

// ─── B-09: getReturnOptions ────────────────────────────────────────────────

export async function getReturnOptions(actor: Actor, orderId: string, now: Date) {
  requireRole(actor, "customer");
  if (!orderId) throw new Error("orderId is required.");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found.");
  requireOwner(actor, order.buyer_id);

  const settings = await readSettings();
  const bDate = businessDate(settings, now);

  const isDelivered = order.status === "delivered" || order.status === "settled";
  let daysLeft = 0;
  if (order.return_window_closes_at) {
    daysLeft = Math.max(0, diffDays(bDate, order.return_window_closes_at.toISOString().slice(0, 10)));
  }

  const openReturn = await prisma.returnRequest.findFirst({
    where: { order_id: orderId, status: { not: "resolved" } },
  });

  const eligible = isDelivered && daysLeft > 0 && !openReturn;

  const reasons = [
    { value: "not_as_graded", label: "Not as graded" },
    { value: "dead_on_arrival", label: "Dead on arrival" },
    { value: "buyer_changed_mind", label: "Changed my mind" },
  ] as const;

  return {
    eligible,
    daysLeft,
    returnWindowClosesAt: order.return_window_closes_at?.toISOString() ?? null,
    reasons: reasons.map((r) => ({
      ...r,
      outcomes: outcomesFor(r.value),
      estimated: raiseMath(order.total, r.value, settings),
    })),
  };
}
