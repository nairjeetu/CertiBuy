import { prisma } from "@certibuy/db";
import {
  PlaceOrderInput,
  CancelOrderInput,
  AdvanceShipmentInput,
  RaiseReturnInput,
  ResolveReturnInput,
} from "@certibuy/contracts";
import type { z } from "zod";
import {
  orderTotal as orderTotalDomain,
  cancelRefund as cancelRefundDomain,
  raiseMath,
  resolutionMath,
  validateOutcome,
  transitionOrder,
  transitionDevice,
  transitionListing,
  businessDate,
  addDays,
  gradePrice,
} from "@certibuy/domain";
import type { Settings, DeviceModel } from "@certibuy/domain";
import type { Actor } from "../actor";
import { requireRole, requireOwner } from "../policy";
import { toDate } from "../util";

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function readSettings(tx: PrismaTx) {
  const s = await tx.settings.findUnique({ where: { id: 1 } });
  if (!s) throw new Error("Settings are missing.");
  return s;
}

// ─── B-05: placeOrder ──────────────────────────────────────────────────────

export async function placeOrder(
  actor: Actor,
  input: z.infer<typeof PlaceOrderInput>,
  now: Date,
) {
  requireRole(actor, "customer");
  const parsed = PlaceOrderInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const settings = await readSettings(tx);
    const bDate = businessDate(settings, now);

    // Clear expired holds on this listing
    const expiredOrders = await tx.order.findMany({
      where: {
        listing_id: parsed.listingId,
        status: "pending",
        hold_expires_at: { lt: now },
      },
    });
    for (const eo of expiredOrders) {
      await tx.order.update({ where: { id: eo.id }, data: { status: "cancelled", cancelled_at: now } });
      await tx.listing.update({ where: { id: eo.listing_id }, data: { status: "active" } });
      await tx.device.update({ where: { id: eo.device_id }, data: { status: "listed" } });
    }

    const listing = await tx.listing.findUnique({
      where: { id: parsed.listingId },
      include: { device: { include: { device_model: true } } },
    });
    if (!listing) throw new Error("Listing not found.");
    if (listing.status !== "active") throw new Error("This listing is not available.");
    if (listing.device.owner !== "certibuy") throw new Error("Device is not owned by CertiBuy.");

    const totals = orderTotalDomain(
      listing.current_price,
      parsed.warrantyAddon,
      listing.warranty_months,
      settings,
    );

    if (parsed.declined) {
      return { ok: true, declined: true, ...totals };
    }

    transitionListing("active", "reserved");
    transitionDevice("listed", "reserved");

    await tx.listing.update({
      where: { id: listing.id },
      data: { status: "reserved" },
    });
    await tx.device.update({
      where: { id: listing.device_id },
      data: { status: "reserved" },
    });

    const order = await tx.order.create({
      data: {
        listing_id: listing.id,
        device_id: listing.device_id,
        buyer_id: actor.id,
        device_price: totals.device_price,
        warranty_addon: totals.warranty_addon,
        warranty_addon_amount: totals.warranty_addon_amount,
        total: totals.total,
        delivery_name: parsed.deliveryName,
        delivery_phone: parsed.deliveryPhone,
        delivery_address: parsed.deliveryAddress,
        payment_method: parsed.paymentMethod,
        status: "paid",
        escrow_status: "hold",
        paid_at: now,
      },
    });

    await tx.paymentIntent.create({
      data: {
        order_id: order.id,
        provider: "simulated",
        amount: totals.total,
        status: "completed",
      },
    });

    await tx.escrowTransaction.create({
      data: {
        order_id: order.id,
        buyer_id: actor.id,
        type: "hold",
        amount: totals.total,
      },
    });

    // SFM: mark balance payout as pending (ready for release)
    if (listing.device.payout_option === "sell_for_more") {
      await tx.payout.updateMany({
        where: {
          device_id: listing.device_id,
          type: "balance",
          status: "due",
        },
        data: { status: "pending" },
      });
    }

    await tx.activityLog.create({
      data: {
        actor_id: actor.id,
        actor_name: actor.fullName,
        text: `Order placed for listing ${listing.id.slice(0, 8)}`,
        entity: "order",
        entity_id: order.id,
        business_date: bDate,
      },
    });

    await tx.notification.create({
      data: {
        user_id: actor.id,
        event: "order_confirmed",
        title: "Order confirmed",
        body: `Your order for ${listing.device.device_model.brand} ${listing.device.device_model.model} has been placed.`,
        link: `/shop/orders/${order.id}`,
      },
    });

    await tx.notification.create({
      data: {
        user_id: listing.device.seller_id,
        event: "device_sold",
        title: "Your device has been sold",
        body: `Your ${listing.device.device_model.brand} ${listing.device.device_model.model} has been purchased.`,
        link: `/seller/deals/${listing.device.submission_id}`,
      },
    });

    return {
      ok: true,
      orderId: order.id,
      total: totals.total,
      escrowStatus: "hold",
    };
  });
}

// ─── B-12: cancelOrder ─────────────────────────────────────────────────────

export async function cancelOrder(
  actor: Actor,
  input: z.infer<typeof CancelOrderInput>,
  now: Date,
) {
  requireRole(actor, "customer", "ops");
  const parsed = CancelOrderInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: parsed.orderId },
      include: { listing: true, device: true },
    });
    if (!order) throw new Error("Order not found.");
    if (actor.role === "customer") requireOwner(actor, order.buyer_id);

    if (order.status === "cancelled") return { ok: true, already: true };

    if (order.status !== "pending" && order.status !== "paid") {
      throw new Error("This order has already been dispatched. You can raise a return after delivery.");
    }

    const settings = await readSettings(tx);
    const bDate = businessDate(settings, now);

    let refundAmount = 0;
    let escrowType = "none";

    if (order.status === "paid") {
      const result = cancelRefundDomain(order.total, settings);
      refundAmount = result.refund;
      escrowType = result.escrow_type;

      await tx.escrowTransaction.create({
        data: {
          order_id: order.id,
          buyer_id: order.buyer_id,
          type: result.escrow_type,
          amount: result.refund,
        },
      });
    }

    transitionOrder(order.status, "cancelled");
    transitionListing("reserved", "active");
    transitionDevice("reserved", "listed");

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "cancelled",
        escrow_status: order.status === "paid"
          ? (escrowType === "refund_full" ? "refunded_full" : "refunded_partial")
          : order.escrow_status,
        refund_amount: refundAmount > 0 ? refundAmount : undefined,
        refunded_at: refundAmount > 0 ? now : undefined,
        cancelled_at: now,
        cancel_reason: parsed.reason ?? null,
      },
    });

    await tx.listing.update({
      where: { id: order.listing_id },
      data: { status: "active" },
    });
    await tx.device.update({
      where: { id: order.device_id },
      data: { status: "listed" },
    });

    await tx.activityLog.create({
      data: {
        actor_id: actor.id,
        actor_name: actor.fullName,
        text: `Order cancelled${parsed.reason ? `: ${parsed.reason}` : ""}`,
        entity: "order",
        entity_id: order.id,
        business_date: bDate,
      },
    });

    await tx.notification.create({
      data: {
        user_id: order.buyer_id,
        event: "order_cancelled",
        title: "Order cancelled",
        body: refundAmount > 0
          ? `Your order has been cancelled. A refund of ₹${refundAmount.toLocaleString("en-IN")} is being processed.`
          : "Your order has been cancelled.",
        link: `/shop/orders/${order.id}`,
      },
    });

    return {
      ok: true,
      already: false,
      orderStatus: "cancelled",
      refund: refundAmount,
      deduction: order.total - refundAmount,
      escrow: escrowType,
    };
  });
}

// ─── B-07: advanceShipment ─────────────────────────────────────────────────

type ShipmentStep = { from: string; to: string; deviceFrom?: string; deviceTo?: "shipped" | "delivered" };
const SHIPMENT_STEPS: ShipmentStep[] = [
  { from: "paid", to: "dispatched", deviceFrom: "reserved", deviceTo: "shipped" },
  { from: "dispatched", to: "in_transit" },
  { from: "in_transit", to: "delivered", deviceFrom: "shipped", deviceTo: "delivered" },
];

export async function advanceShipment(
  actor: Actor,
  input: z.infer<typeof AdvanceShipmentInput>,
  now: Date,
) {
  const parsed = AdvanceShipmentInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const settings = await readSettings(tx);

    // Allow buyer in demo mode, otherwise require ops
    if (actor.role !== "ops" && !actor.isAdmin) {
      if (!settings.demo_mode) {
        throw new Error("Only ops can advance shipments.");
      }
      requireRole(actor, "customer");
    }

    const order = await tx.order.findUnique({
      where: { id: parsed.orderId },
      include: { device: true },
    });
    if (!order) throw new Error("Order not found.");

    if (actor.role === "customer") requireOwner(actor, order.buyer_id);

    const step = SHIPMENT_STEPS.find((s) => s.from === order.status);
    if (!step) throw new Error(`No next shipment state from "${order.status}".`);

    transitionOrder(order.status as Parameters<typeof transitionOrder>[0], step.to as Parameters<typeof transitionOrder>[1]);

    const updateData: Record<string, unknown> = { status: step.to };
    const bDate = businessDate(settings, now);

    if (step.to === "dispatched") updateData.dispatched_at = now;
    if (step.to === "in_transit") updateData.in_transit_at = now;
    if (step.to === "delivered") {
      updateData.delivered_at = now;
      const windowEnd = addDays(bDate, settings.return_window_days);
      updateData.return_window_closes_at = toDate(windowEnd + "T23:59:59.999+05:30");
    }

    await tx.order.update({ where: { id: order.id }, data: updateData });

    if (step.deviceFrom && step.deviceTo) {
      transitionDevice(
        step.deviceFrom as Parameters<typeof transitionDevice>[0],
        step.deviceTo as Parameters<typeof transitionDevice>[1],
      );
      await tx.device.update({
        where: { id: order.device_id },
        data: { status: step.deviceTo },
      });
    }

    const shipment = await tx.shipment.create({
      data: {
        order_id: order.id,
        status: step.to,
        advanced_by: actor.id,
      },
    });

    await tx.activityLog.create({
      data: {
        actor_id: actor.id,
        actor_name: actor.fullName,
        text: `Shipment: ${step.from} → ${step.to}`,
        entity: "order",
        entity_id: order.id,
        business_date: bDate,
      },
    });

    await tx.notification.create({
      data: {
        user_id: order.buyer_id,
        event: `order_${step.to}`,
        title: step.to === "delivered" ? "Device delivered" : `Order ${step.to.replace("_", " ")}`,
        body: step.to === "delivered"
          ? "Your device has been delivered. You have a 7-day return window."
          : `Your order is now ${step.to.replace("_", " ")}.`,
        link: `/shop/orders/${order.id}`,
      },
    });

    return { ok: true, newStatus: step.to, shipmentId: shipment.id };
  });
}

// ─── B-09: raiseReturn ─────────────────────────────────────────────────────

export async function raiseReturn(
  actor: Actor,
  input: z.infer<typeof RaiseReturnInput>,
  now: Date,
) {
  requireRole(actor, "customer");
  const parsed = RaiseReturnInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: parsed.orderId },
      include: { device: true },
    });
    if (!order) throw new Error("Order not found.");
    requireOwner(actor, order.buyer_id);

    if (order.status !== "delivered" && order.status !== "settled") {
      throw new Error("Returns can only be raised on delivered or settled orders.");
    }

    const settings = await readSettings(tx);
    const bDate = businessDate(settings, now);

    if (order.return_window_closes_at && now > order.return_window_closes_at) {
      throw new Error("The return window has closed.");
    }

    const openReturn = await tx.returnRequest.findFirst({
      where: { order_id: order.id, status: { not: "resolved" } },
    });
    if (openReturn) throw new Error("A return request is already open for this order.");

    const math = raiseMath(order.total, parsed.reason, settings);

    const returnReq = await tx.returnRequest.create({
      data: {
        order_id: order.id,
        buyer_id: actor.id,
        device_id: order.device_id,
        reason: parsed.reason,
        buyer_reason_note: parsed.note ?? "",
        doa_preference: parsed.doaPreference ?? null,
        photos: parsed.photos ? JSON.parse(JSON.stringify(parsed.photos)) : [],
        status: "awaiting_reinspection",
        original_amount: math.original,
        deduction_amount: math.deduction,
        deduction_label: math.deduction_label,
        refund_amount: math.refund,
      },
    });

    await tx.exceptionCase.create({
      data: {
        type: "return_exception",
        title: `Return on order ${order.id.slice(0, 8)}: ${parsed.reason}`,
        related_entity: "order",
        related_id: order.id,
      },
    });

    await tx.device.update({
      where: { id: order.device_id },
      data: { return_count: { increment: 1 } },
    });

    await tx.profile.update({
      where: { id: actor.id },
      data: { return_count: { increment: 1 } },
    });

    await tx.activityLog.create({
      data: {
        actor_id: actor.id,
        actor_name: actor.fullName,
        text: `Return raised: ${parsed.reason}`,
        entity: "order",
        entity_id: order.id,
        business_date: bDate,
      },
    });

    await tx.notification.create({
      data: {
        user_id: actor.id,
        event: "return_raised",
        title: "Return request received",
        body: `Your return request for order ${order.id.slice(0, 8)} has been received.`,
        link: `/shop/orders/${order.id}`,
      },
    });

    return {
      ok: true,
      returnId: returnReq.id,
      status: "awaiting_reinspection",
      estimated: math,
    };
  });
}

// ─── O-07: resolveReturn ───────────────────────────────────────────────────

export async function resolveReturn(
  actor: Actor,
  input: z.infer<typeof ResolveReturnInput>,
  now: Date,
) {
  requireRole(actor, "ops");
  const parsed = ResolveReturnInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const returnReq = await tx.returnRequest.findUnique({
      where: { id: parsed.returnId },
      include: { order: { include: { device: { include: { device_model: true } } } } },
    });
    if (!returnReq) throw new Error("Return request not found.");

    if (returnReq.status === "resolved") {
      return { ok: true, already: true };
    }

    validateOutcome(returnReq.reason, parsed.outcome);

    const settings = await readSettings(tx);
    const bDate = businessDate(settings, now);
    const order = returnReq.order;
    const math = resolutionMath(order.total, parsed.outcome, settings);

    await tx.returnRequest.update({
      where: { id: returnReq.id },
      data: {
        status: "resolved",
        outcome: parsed.outcome,
        original_amount: math.original,
        deduction_amount: math.deduction,
        deduction_label: math.deduction_label,
        refund_amount: math.refund,
        resolved_by: actor.id,
        resolved_at: now,
      },
    });

    if (math.refund > 0) {
      await tx.escrowTransaction.create({
        data: {
          order_id: order.id,
          buyer_id: order.buyer_id,
          type: math.escrow_type,
          amount: math.refund,
        },
      });
    }

    const isReplacement = parsed.outcome === "doa_replacement";
    const newOrderStatus = isReplacement ? "replaced" : "refunded";
    transitionOrder(
      order.status as Parameters<typeof transitionOrder>[0],
      newOrderStatus as Parameters<typeof transitionOrder>[1],
    );
    transitionDevice("delivered", "returned");

    const orderUpdate: Record<string, unknown> = {
      status: newOrderStatus,
      escrow_status: isReplacement ? "held_replacement" : (math.escrow_type === "refund_full" ? "refunded_full" : "refunded_partial"),
    };
    if (!isReplacement) {
      orderUpdate.refund_amount = math.refund;
      orderUpdate.refunded_at = now;
    }

    const isFaulty = parsed.outcome === "faulty" || parsed.outcome === "doa_confirmed";
    const isHealthyReturn = parsed.outcome === "as_shipped" || parsed.outcome === "changed_mind";

    if (isFaulty) {
      transitionDevice("returned", "in_refurbishment");
      await tx.device.update({
        where: { id: order.device_id },
        data: { status: "in_refurbishment" },
      });
    } else if (isHealthyReturn) {
      transitionDevice("returned", "listed");
      await tx.device.update({
        where: { id: order.device_id },
        data: { status: "listed" },
      });

      const dm = order.device.device_model;
      const domModel = dm as unknown as DeviceModel;
      const domSettings = settings as unknown as Settings;
      const grade = order.device.final_grade as "A" | "B" | "C" | "D";
      const isGradeD = grade === "D";
      const basePrice = gradePrice(domModel, grade, domSettings);

      const existingListing = await tx.listing.findUnique({
        where: { device_id: order.device_id },
      });
      if (existingListing) {
        transitionListing(
          existingListing.status as Parameters<typeof transitionListing>[0],
          "active",
        );
        await tx.listing.update({
          where: { id: existingListing.id },
          data: {
            base_price: basePrice,
            current_price: basePrice,
            floor_price: dm.b2b_floor_price,
            listed_at: bDate,
            ladder_step: 0,
            reserved_days: 0,
            override_price: null,
            override_by: null,
            override_at: null,
            warranty_months: isGradeD ? 0 : domSettings.warranty_months,
            status: "active",
          },
        });
      }
    } else {
      await tx.device.update({
        where: { id: order.device_id },
        data: { status: "returned" },
      });
    }

    // For DOA replacement, try to find a replacement
    if (isReplacement) {
      const replacement = await tx.device.findFirst({
        where: {
          device_model_id: order.device.device_model_id,
          status: "listed",
          id: { not: order.device_id },
        },
      });
      if (replacement) {
        orderUpdate.replacement_device_id = replacement.id;
        await tx.returnRequest.update({
          where: { id: returnReq.id },
          data: { replacement_device_id: replacement.id },
        });
      }
    }

    await tx.order.update({ where: { id: order.id }, data: orderUpdate });

    // Close linked exception cases
    await tx.exceptionCase.updateMany({
      where: {
        related_entity: "order",
        related_id: order.id,
        type: "return_exception",
        status: "open",
      },
      data: { status: "resolved", resolution: `${parsed.outcome}${parsed.reason ? `: ${parsed.reason}` : ""}` },
    });

    await tx.activityLog.create({
      data: {
        actor_id: actor.id,
        actor_name: actor.fullName,
        text: `Return resolved: ${parsed.outcome}, refund ₹${math.refund.toLocaleString("en-IN")}`,
        entity: "order",
        entity_id: order.id,
        business_date: bDate,
      },
    });

    await tx.notification.create({
      data: {
        user_id: order.buyer_id,
        event: "return_resolved",
        title: "Return resolved",
        body: math.refund > 0
          ? `Your return has been resolved. A refund of ₹${math.refund.toLocaleString("en-IN")} is being processed.`
          : "Your return has been resolved with a replacement.",
        link: `/shop/orders/${order.id}`,
      },
    });

    return {
      ok: true,
      already: false,
      outcome: parsed.outcome,
      refund: math.refund,
      deduction: math.deduction,
      escrow: math.escrow_type,
      orderStatus: newOrderStatus,
    };
  });
}

// ─── Mark notifications read ──────────────────────────────────────────────

export async function markNotificationsRead(actor: Actor, body: { ids?: string[] }) {
  const where = body.ids?.length
    ? { id: { in: body.ids }, user_id: actor.id }
    : { user_id: actor.id, read: false };

  await prisma.notification.updateMany({ where, data: { read: true } });
  return { ok: true };
}

// ─── Update profile ──────────────────────────────────────────────────────

export async function updateProfile(
  actor: Actor,
  body: { fullName?: string; phone?: string; city?: string; deliveryAddress?: string; payoutAccount?: string },
) {
  const data: Record<string, string> = {};
  if (body.fullName !== undefined) data.full_name = body.fullName.trim();
  if (body.phone !== undefined) data.phone = body.phone.trim();
  if (body.city !== undefined) data.city = body.city.trim();
  if (body.deliveryAddress !== undefined) data.delivery_address = body.deliveryAddress.trim();
  if (body.payoutAccount !== undefined) data.payout_account = body.payoutAccount.trim();

  if (Object.keys(data).length === 0) return { ok: true };

  await prisma.profile.update({ where: { id: actor.id }, data });
  return { ok: true };
}
