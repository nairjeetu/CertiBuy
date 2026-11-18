import { prisma } from "@certibuy/db";
import {
  RunDailyJobsInput,
  AdvanceDemoClockInput,
  ResolveExceptionInput,
  UpdateSettingsInput,
  TogglePayoutFailureInput,
  SaveDeviceModelInput,
  MarkRefurbishedInput,
  LiquidateDeviceInput,
  RepriceListingInput,
  SetOverridePriceInput,
  PauseIcForModelInput,
} from "@certibuy/contracts";
import type { z } from "zod";
import {
  ladderFor,
  nextPayoutState,
  scoreModel,
  transitionDevice,
  transitionListing,
  transitionOrder,
  businessDate,
  addDays,
  diffDays,
  gradePrice,
} from "@certibuy/domain";
import type { Settings, Listing, PayoutRecord, DeviceModel } from "@certibuy/domain";
import type { Actor } from "../actor";
import { requireRole } from "../policy";

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function readSettings(tx: PrismaTx) {
  const s = await tx.settings.findUnique({ where: { id: 1 } });
  if (!s) throw new Error("Settings are missing.");
  return s;
}

function settingsToDomain(s: Awaited<ReturnType<typeof readSettings>>): Settings {
  return s as unknown as Settings;
}

// ─── Daily job steps ──────────────────────────────────────────────────────

async function stepPriceLadder(tx: PrismaTx, settings: Settings, bDate: string) {
  const listings = await tx.listing.findMany({
    where: { status: "active" },
    include: { device: { select: { id: true, status: true } } },
  });
  let count = 0;
  for (const l of listings) {
    const domListing: Listing = {
      id: l.id,
      device_id: l.device_id,
      base_price: l.base_price,
      current_price: l.current_price,
      floor_price: l.floor_price,
      ladder_step: l.ladder_step,
      listed_at: l.listed_at,
      reserved_days: l.reserved_days,
      override_price: l.override_price,
      warranty_months: l.warranty_months,
      status: l.status,
    };
    const result = ladderFor(domListing, settings, bDate);
    const priceChanged = result.current_price !== l.current_price;
    const stepChanged = result.ladder_step !== l.ladder_step;
    const needsReview = result.at_review && l.status !== "review";

    if (!priceChanged && !stepChanged && !needsReview) continue;

    const listingUpdate: Record<string, unknown> = {};
    if (priceChanged) listingUpdate.current_price = result.current_price;
    if (stepChanged) listingUpdate.ladder_step = result.ladder_step;

    if (needsReview) {
      transitionListing(l.status, "review");
      listingUpdate.status = "review";
      if (l.device) {
        transitionDevice(l.device.status, "day45_review");
        await tx.device.update({
          where: { id: l.device.id },
          data: { status: "day45_review" },
        });
      }
    }

    await tx.listing.update({ where: { id: l.id }, data: listingUpdate });
    count++;
  }
  return count;
}

async function stepDay21Balance(tx: PrismaTx, settings: Settings, bDate: string) {
  const payouts = await tx.payout.findMany({
    where: { trigger: "day_21_unsold", status: "due" },
    include: { device: { select: { id: true, created_at: true } } },
  });
  let count = 0;
  for (const p of payouts) {
    if (!p.device) continue;
    const deviceDate = p.device.created_at.toISOString().slice(0, 10);
    const age = diffDays(deviceDate, bDate);
    if (age >= settings.balance_day) {
      await tx.payout.update({ where: { id: p.id }, data: { status: "pending" } });
      count++;
    }
  }
  return count;
}

async function stepPayoutRun(tx: PrismaTx, settings: Settings, bDate: string) {
  const payouts = await tx.payout.findMany({ where: { status: "pending" } });
  let count = 0;
  for (const p of payouts) {
    const success = !settings.simulate_payout_failure;
    const domPayout: PayoutRecord = {
      id: p.id,
      type: p.type,
      amount: p.amount,
      status: p.status,
      attempts: p.attempts,
      failure_reason: p.failure_reason,
    };
    const transition = nextPayoutState(
      domPayout,
      { success, reference: success ? `SIM-${Date.now()}` : undefined, failure_reason: success ? undefined : "Simulated failure" },
      settings,
      bDate,
    );
    await tx.payout.update({
      where: { id: p.id },
      data: {
        status: transition.new_status,
        attempts: p.attempts + 1,
        failure_reason: success ? undefined : "Simulated failure",
        ...(transition.paid_at ? { paid_at: new Date(transition.paid_at) } : {}),
      },
    });
    await tx.payoutAttempt.create({
      data: {
        payout_id: p.id,
        success,
        reference: success ? `SIM-${Date.now()}` : undefined,
        failure_reason: success ? undefined : "Simulated failure",
      },
    });
    if (transition.open_exception) {
      await tx.exceptionCase.create({
        data: {
          type: "payment_hold",
          title: `Payout failed after ${p.attempts + 1} attempts`,
          detail: `Payout ${p.id} for ₹${p.amount} — ${p.failure_reason ?? "Simulated failure"}`,
          related_entity: "payout",
          related_id: p.id,
          status: "open",
        },
      });
    }
    count++;
  }
  return count;
}

async function stepEscrowRelease(tx: PrismaTx, _settings: Settings, bDate: string) {
  const orders = await tx.order.findMany({
    where: { status: "delivered", escrow_status: "hold" },
    include: { device: { select: { id: true, status: true } } },
  });
  let count = 0;
  for (const o of orders) {
    if (!o.return_window_closes_at) continue;
    const closes = o.return_window_closes_at.toISOString().slice(0, 10);
    if (closes > bDate) continue;

    transitionOrder(o.status, "settled");
    await tx.escrowTransaction.create({
      data: { order_id: o.id, buyer_id: o.buyer_id, type: "release", amount: o.total },
    });
    await tx.order.update({
      where: { id: o.id },
      data: { status: "settled", escrow_status: "released", settled_at: new Date() },
    });
    if (o.device) {
      transitionDevice(o.device.status, "settled");
      await tx.device.update({ where: { id: o.device.id }, data: { status: "settled" } });
    }
    count++;
  }
  return count;
}

async function stepOfferExpiry(tx: PrismaTx, _settings: Settings, bDate: string) {
  const offers = await tx.offer.findMany({
    where: { status: "active" },
    include: { submission: { select: { id: true, status: true } } },
  });
  let count = 0;
  for (const o of offers) {
    if (!o.expires_at) continue;
    const expiresDate = o.expires_at.toISOString().slice(0, 10);
    if (expiresDate > bDate) continue;

    await tx.offer.update({ where: { id: o.id }, data: { status: "expired" } });
    if (o.submission && o.submission.status !== "abandoned") {
      await tx.submission.update({ where: { id: o.submission.id }, data: { status: "abandoned" } });
    }
    count++;
  }
  return count;
}

async function stepNoShows(tx: PrismaTx, _settings: Settings, bDate: string) {
  const bookings = await tx.booking.findMany({
    where: { status: "booked" },
    include: { submission: { select: { id: true, status: true } } },
  });
  let count = 0;
  for (const b of bookings) {
    if (b.date >= bDate) continue;
    await tx.booking.update({ where: { id: b.id }, data: { status: "no_show" } });
    if (b.submission && !["abandoned", "accepted", "rejected"].includes(b.submission.status)) {
      await tx.submission.update({ where: { id: b.submission.id }, data: { status: "abandoned" } });
    }
    count++;
  }
  return count;
}

async function stepReminders(tx: PrismaTx, _settings: Settings, bDate: string) {
  const tomorrow = addDays(bDate, 1);
  const bookings = await tx.booking.findMany({
    where: { status: "booked", date: tomorrow },
    include: { submission: { select: { seller_id: true } } },
  });
  let count = 0;
  for (const b of bookings) {
    if (!b.submission) continue;
    const dedupeKey = `booking-reminder-${b.id}-${tomorrow}`;
    const existing = await tx.notification.findUnique({ where: { dedupe_key: dedupeKey } });
    if (existing) continue;
    await tx.notification.create({
      data: {
        user_id: b.submission.seller_id,
        event: "booking_reminder",
        title: "Inspection tomorrow",
        body: `Your inspection is booked for ${tomorrow} at ${b.slot}.`,
        link: `/seller`,
        dedupe_key: dedupeKey,
      },
    });
    count++;
  }
  return count;
}

// ─── O-12: runDailyJobs ───────────────────────────────────────────────────

export interface JobRunResult {
  businessDate: string;
  counts: {
    ladder: number;
    balance: number;
    payout: number;
    escrow: number;
    offers: number;
    noShows: number;
    reminders: number;
  };
}

export async function runDailyJobs(
  actor: Actor,
  input: z.infer<typeof RunDailyJobsInput>,
  now: Date,
): Promise<JobRunResult> {
  requireRole(actor, "ops");
  const parsed = RunDailyJobsInput.parse(input);

  const settings = await readSettings(prisma);
  const domSettings = settingsToDomain(settings);
  const bDate = parsed.date ?? businessDate(domSettings, now);

  const counts = { ladder: 0, balance: 0, payout: 0, escrow: 0, offers: 0, noShows: 0, reminders: 0 };

  counts.ladder = await prisma.$transaction(tx => stepPriceLadder(tx, domSettings, bDate));
  counts.balance = await prisma.$transaction(tx => stepDay21Balance(tx, domSettings, bDate));
  counts.payout = await prisma.$transaction(tx => stepPayoutRun(tx, domSettings, bDate));
  counts.escrow = await prisma.$transaction(tx => stepEscrowRelease(tx, domSettings, bDate));
  counts.offers = await prisma.$transaction(tx => stepOfferExpiry(tx, domSettings, bDate));
  counts.noShows = await prisma.$transaction(tx => stepNoShows(tx, domSettings, bDate));
  counts.reminders = await prisma.$transaction(tx => stepReminders(tx, domSettings, bDate));

  await prisma.jobRun.upsert({
    where: { job_name: "daily" },
    update: { last_run_at: now, business_date: bDate, counts, status: "idle", error: null },
    create: { job_name: "daily", last_run_at: now, business_date: bDate, counts, status: "idle" },
  });

  await prisma.activityLog.create({
    data: {
      actor_id: actor.id,
      actor_name: actor.fullName,
      text: `Ran daily job for ${bDate}`,
      entity: "job",
      entity_id: "daily",
      business_date: bDate,
    },
  });

  return { businessDate: bDate, counts };
}

// ─── O-11: advanceDemoClock ───────────────────────────────────────────────

export async function advanceDemoClock(
  actor: Actor,
  input: z.infer<typeof AdvanceDemoClockInput>,
  now: Date,
): Promise<{ newOffset: number; jobResults: JobRunResult[] }> {
  requireRole(actor, "ops");
  const parsed = AdvanceDemoClockInput.parse(input);

  const settings = await readSettings(prisma);
  if (!settings.demo_mode) throw new Error("Demo mode is not enabled.");

  const jobResults: JobRunResult[] = [];
  let offset = settings.sim_day_offset;

  for (let i = 0; i < parsed.days; i++) {
    offset++;
    await prisma.settings.update({ where: { id: 1 }, data: { sim_day_offset: offset } });
    const updatedSettings = await readSettings(prisma);
    const bDate = businessDate(settingsToDomain(updatedSettings), now);
    const result = await runDailyJobsInternal(actor, bDate, now);
    jobResults.push(result);
  }

  return { newOffset: offset, jobResults };
}

async function runDailyJobsInternal(
  _actor: Actor,
  bDate: string,
  now: Date,
): Promise<JobRunResult> {
  const settings = await readSettings(prisma);
  const domSettings = settingsToDomain(settings);
  const counts = { ladder: 0, balance: 0, payout: 0, escrow: 0, offers: 0, noShows: 0, reminders: 0 };

  counts.ladder = await prisma.$transaction(tx => stepPriceLadder(tx, domSettings, bDate));
  counts.balance = await prisma.$transaction(tx => stepDay21Balance(tx, domSettings, bDate));
  counts.payout = await prisma.$transaction(tx => stepPayoutRun(tx, domSettings, bDate));
  counts.escrow = await prisma.$transaction(tx => stepEscrowRelease(tx, domSettings, bDate));
  counts.offers = await prisma.$transaction(tx => stepOfferExpiry(tx, domSettings, bDate));
  counts.noShows = await prisma.$transaction(tx => stepNoShows(tx, domSettings, bDate));
  counts.reminders = await prisma.$transaction(tx => stepReminders(tx, domSettings, bDate));

  await prisma.jobRun.upsert({
    where: { job_name: "daily" },
    update: { last_run_at: now, business_date: bDate, counts, status: "idle", error: null },
    create: { job_name: "daily", last_run_at: now, business_date: bDate, counts, status: "idle" },
  });

  return { businessDate: bDate, counts };
}

// ─── O-05: recalcLiquidity ────────────────────────────────────────────────

export async function recalcLiquidity(
  actor: Actor,
  _input: unknown,
  now: Date,
): Promise<{ updated: number }> {
  requireRole(actor, "ops");

  const settings = await readSettings(prisma);
  const domSettings = settingsToDomain(settings);
  const bDate = businessDate(domSettings, now);

  const models = await prisma.deviceModel.findMany({ where: { active: true } });
  let updated = 0;

  for (const m of models) {
    const settledOrders = await prisma.order.findMany({
      where: { status: "settled", device: { device_model_id: m.id } },
      include: { device: true, listing: true },
    });

    const sales = settledOrders
      .filter(o => o.device && o.listing)
      .map(o => {
        const listedAt = o.listing!.listed_at;
        const settledAt = o.settled_at ? o.settled_at.toISOString().slice(0, 10) : bDate;
        return {
          device_model_id: m.id,
          days_to_sell: Math.max(1, diffDays(listedAt, settledAt)),
          achieved_price_ratio: o.device_price / (m.market_price_a || 1),
        };
      });

    const day45Count = await prisma.device.count({
      where: { device_model_id: m.id, status: "day45_review" },
    });

    const activeListings = await prisma.listing.count({
      where: { status: "active", device: { device_model_id: m.id } },
    });
    const recentOrders = await prisma.order.count({
      where: {
        device: { device_model_id: m.id },
        status: { in: ["paid", "dispatched", "in_transit", "delivered", "settled"] },
      },
    });
    const demandScore = activeListings > 0
      ? Math.min(100, Math.round((recentOrders / activeListings) * 100))
      : 50;

    const result = scoreModel({
      model: m as unknown as Parameters<typeof scoreModel>[0]["model"],
      sales,
      demand_score: demandScore,
      day45_returns: day45Count,
      today: bDate,
      settings: domSettings,
    });

    await prisma.liquidityScore.updateMany({
      where: { device_model_id: m.id, is_current: true },
      data: { is_current: false },
    });
    await prisma.liquidityScore.create({
      data: {
        device_model_id: m.id,
        score: result.score,
        days_to_sell: result.days_to_sell,
        volatility: result.volatility,
        launch_window: result.launch_window,
        source: result.source,
        is_current: true,
      },
    });
    updated++;
  }

  await prisma.jobRun.upsert({
    where: { job_name: "liquidity" },
    update: { last_run_at: now, business_date: bDate, counts: { updated }, status: "idle", error: null },
    create: { job_name: "liquidity", last_run_at: now, business_date: bDate, counts: { updated }, status: "idle" },
  });

  await prisma.activityLog.create({
    data: {
      actor_id: actor.id,
      actor_name: actor.fullName,
      text: `Recalculated liquidity for ${updated} models`,
      entity: "job",
      entity_id: "liquidity",
      business_date: bDate,
    },
  });

  return { updated };
}

// ─── O-10: computeMetrics ─────────────────────────────────────────────────

export async function computeMetrics(
  actor: Actor,
  _input: unknown,
  now: Date,
): Promise<{ snapshots: number }> {
  requireRole(actor, "ops");

  const settings = await readSettings(prisma);
  const domSettings = settingsToDomain(settings);
  const bDate = businessDate(domSettings, now);

  const weeks: { start: string; end: string }[] = [];
  for (let i = 7; i >= 0; i--) {
    const end = addDays(bDate, -i * 7);
    const start = addDays(end, -6);
    weeks.push({ start, end });
  }

  let snapshots = 0;
  for (const week of weeks) {
    const startDate = new Date(week.start + "T00:00:00+05:30");
    const endDate = new Date(week.end + "T23:59:59+05:30");

    const devicesListed = await prisma.listing.count({
      where: { created_at: { gte: startDate, lte: endDate } },
    });
    const devicesSold = await prisma.order.count({
      where: { status: { in: ["settled", "delivered"] }, paid_at: { gte: startDate, lte: endDate } },
    });

    const settledInWeek = await prisma.order.findMany({
      where: { status: "settled", settled_at: { gte: startDate, lte: endDate } },
      include: { listing: true },
    });
    const daysToSellValues = settledInWeek
      .filter(o => o.listing)
      .map(o => {
        const listedAt = o.listing!.listed_at;
        const settled = o.settled_at ? o.settled_at.toISOString().slice(0, 10) : week.end;
        return Math.max(1, diffDays(listedAt, settled));
      });
    const avgDaysToSell = daysToSellValues.length > 0
      ? daysToSellValues.reduce((a, b) => a + b, 0) / daysToSellValues.length
      : 0;

    const revenueAgg = await prisma.order.aggregate({
      where: { status: { in: ["settled", "delivered"] }, paid_at: { gte: startDate, lte: endDate } },
      _sum: { total: true },
    });
    const revenue = revenueAgg._sum.total ?? 0;
    const avgSalePrice = devicesSold > 0 ? revenue / devicesSold : 0;

    const deliveredCount = await prisma.order.count({
      where: { status: { in: ["delivered", "settled", "refunded", "replaced"] }, delivered_at: { gte: startDate, lte: endDate } },
    });
    const returnedCount = await prisma.order.count({
      where: { status: { in: ["refunded", "replaced"] }, delivered_at: { gte: startDate, lte: endDate } },
    });
    const returnRate = deliveredCount > 0 ? (returnedCount / deliveredCount) * 100 : 0;

    const payoutsAttempted = await prisma.payoutAttempt.count({
      where: { created_at: { gte: startDate, lte: endDate } },
    });
    const payoutsSucceeded = await prisma.payoutAttempt.count({
      where: { success: true, created_at: { gte: startDate, lte: endDate } },
    });
    const payoutSuccessRate = payoutsAttempted > 0 ? (payoutsSucceeded / payoutsAttempted) * 100 : 100;

    const activeListings = await prisma.listing.count({
      where: { status: "active", created_at: { lte: endDate } },
    });

    const totalListings = await prisma.listing.count({
      where: { created_at: { gte: startDate, lte: endDate } },
    });
    const conversionRate = totalListings > 0 ? (devicesSold / totalListings) * 100 : 0;

    const metrics: Record<string, number> = {
      devices_listed: devicesListed,
      devices_sold: devicesSold,
      avg_days_to_sell: Math.round(avgDaysToSell * 10) / 10,
      revenue,
      avg_sale_price: Math.round(avgSalePrice),
      return_rate: Math.round(returnRate * 10) / 10,
      payout_success_rate: Math.round(payoutSuccessRate * 10) / 10,
      active_listings: activeListings,
      conversion_rate: Math.round(conversionRate * 10) / 10,
    };

    for (const [name, value] of Object.entries(metrics)) {
      await prisma.metricSnapshot.upsert({
        where: { metric_name_week_start: { metric_name: name, week_start: week.start } },
        update: { value, computed_at: now },
        create: { metric_name: name, week_start: week.start, value },
      });
      snapshots++;
    }
  }

  await prisma.jobRun.upsert({
    where: { job_name: "metrics" },
    update: { last_run_at: now, business_date: bDate, counts: { snapshots }, status: "idle", error: null },
    create: { job_name: "metrics", last_run_at: now, business_date: bDate, counts: { snapshots }, status: "idle" },
  });

  await prisma.activityLog.create({
    data: {
      actor_id: actor.id,
      actor_name: actor.fullName,
      text: `Computed ${snapshots} metric snapshots`,
      entity: "job",
      entity_id: "metrics",
      business_date: bDate,
    },
  });

  return { snapshots };
}

// ─── O-07: resolveException ───────────────────────────────────────────────

export async function resolveException(
  actor: Actor,
  input: z.infer<typeof ResolveExceptionInput>,
  now: Date,
) {
  requireRole(actor, "ops");
  const parsed = ResolveExceptionInput.parse(input);

  const exc = await prisma.exceptionCase.findUnique({ where: { id: parsed.exceptionId } });
  if (!exc) throw new Error("Exception not found.");
  if (exc.status === "resolved") throw new Error("Already resolved.");

  await prisma.exceptionCase.update({
    where: { id: parsed.exceptionId },
    data: { status: "resolved", resolution: parsed.resolution },
  });

  const settings = await readSettings(prisma);
  const bDate = businessDate(settingsToDomain(settings), now);
  await prisma.activityLog.create({
    data: {
      actor_id: actor.id,
      actor_name: actor.fullName,
      text: `Resolved exception: ${exc.title}`,
      entity: "exception",
      entity_id: exc.id,
      business_date: bDate,
    },
  });

  return { ok: true };
}

// ─── O-04: updateSettings ─────────────────────────────────────────────────

export async function updateSettings(
  actor: Actor,
  input: z.infer<typeof UpdateSettingsInput>,
  now: Date,
) {
  requireRole(actor, "ops");
  const parsed = UpdateSettingsInput.parse(input);

  const keysToUpdate = Object.entries(parsed).filter(([, v]) => v !== undefined);
  if (keysToUpdate.length === 0) throw new Error("No fields to update.");

  const current = await readSettings(prisma);
  const data: Record<string, unknown> = {};
  for (const [key, value] of keysToUpdate) {
    data[key] = value;
  }
  data.version = current.version + 1;

  await prisma.settings.update({ where: { id: 1 }, data });

  await prisma.settingsHistory.create({
    data: { actor_id: actor.id, changes: parsed },
  });

  const bDate = businessDate(settingsToDomain(current), now);
  await prisma.activityLog.create({
    data: {
      actor_id: actor.id,
      actor_name: actor.fullName,
      text: `Updated settings: ${keysToUpdate.map(([k]) => k).join(", ")}`,
      entity: "settings",
      entity_id: "1",
      business_date: bDate,
    },
  });

  return { ok: true, version: current.version + 1 };
}

// ─── O-11: togglePayoutFailure ────────────────────────────────────────────

export async function togglePayoutFailure(
  actor: Actor,
  input: z.infer<typeof TogglePayoutFailureInput>,
  now: Date,
) {
  requireRole(actor, "ops");
  const parsed = TogglePayoutFailureInput.parse(input);

  await prisma.settings.update({
    where: { id: 1 },
    data: { simulate_payout_failure: parsed.enabled },
  });

  const settings = await readSettings(prisma);
  const bDate = businessDate(settingsToDomain(settings), now);
  await prisma.activityLog.create({
    data: {
      actor_id: actor.id,
      actor_name: actor.fullName,
      text: `${parsed.enabled ? "Enabled" : "Disabled"} simulated payout failure`,
      entity: "settings",
      entity_id: "1",
      business_date: bDate,
    },
  });

  return { ok: true, simulate_payout_failure: parsed.enabled };
}

// ─── O-03: saveDeviceModel ────────────────────────────────────────────────

export async function saveDeviceModel(
  actor: Actor,
  input: z.infer<typeof SaveDeviceModelInput>,
  now: Date,
) {
  requireRole(actor, "ops");
  const parsed = SaveDeviceModelInput.parse(input);

  const { id, ...fields } = parsed;
  const data = {
    brand: fields.brand,
    model: fields.model,
    storage: fields.storage,
    category: fields.category,
    original_price: fields.original_price,
    market_price_a: fields.market_price_a,
    market_price_b: fields.market_price_b ?? null,
    market_price_c: fields.market_price_c ?? null,
    market_price_d: fields.market_price_d ?? null,
    b2b_floor_price: fields.b2b_floor_price,
    liquidity_tier: fields.liquidity_tier,
    launch_date: fields.launch_date ?? null,
    successor_launch_date: fields.successor_launch_date ?? null,
    ic_paused: fields.ic_paused ?? false,
    active: fields.active ?? true,
  };

  let result;
  if (id) {
    result = await prisma.deviceModel.update({ where: { id }, data });
  } else {
    result = await prisma.deviceModel.create({ data });
  }

  const settings = await readSettings(prisma);
  const bDate = businessDate(settingsToDomain(settings), now);
  await prisma.activityLog.create({
    data: {
      actor_id: actor.id,
      actor_name: actor.fullName,
      text: `${id ? "Updated" : "Created"} device model: ${fields.brand} ${fields.model}`,
      entity: "device_model",
      entity_id: result.id,
      business_date: bDate,
    },
  });

  return { ok: true, id: result.id };
}

// ─── F9: Mark refurbished and list ───────────────────────────────────────────

export async function markRefurbishedAndList(
  actor: Actor,
  input: z.infer<typeof MarkRefurbishedInput>,
  now: Date,
) {
  requireRole(actor, "ops");
  const parsed = MarkRefurbishedInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const device = await tx.device.findUnique({
      where: { id: parsed.deviceId },
      include: { device_model: true },
    });
    if (!device) throw new Error("Device not found.");
    if (device.status !== "in_refurbishment") {
      throw new Error(`Device is ${device.status}, expected in_refurbishment.`);
    }
    transitionDevice("in_refurbishment", "listed");

    const settings = settingsToDomain(await readSettings(tx));
    const bDate = businessDate(settings, now);
    const dm = device.device_model;
    const domModel = dm as unknown as DeviceModel;
    const basePrice = gradePrice(domModel, "D", settings);

    const existingListing = await tx.listing.findUnique({
      where: { device_id: device.id },
    });

    let listingId: string;
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
          warranty_months: 0,
          status: "active",
        },
      });
      listingId = existingListing.id;
    } else {
      const listing = await tx.listing.create({
        data: {
          device_id: device.id,
          base_price: basePrice,
          current_price: basePrice,
          floor_price: dm.b2b_floor_price,
          listed_at: bDate,
          warranty_months: 0,
          status: "active",
        },
      });
      listingId = listing.id;
    }

    await tx.device.update({
      where: { id: device.id },
      data: { status: "listed", parts_replaced: parsed.partsReplaced },
    });

    await tx.activityLog.create({
      data: {
        actor_id: actor.id,
        actor_name: actor.fullName,
        text: `Refurbished and listed grade-D device at ₹${basePrice.toLocaleString("en-IN")} (no warranty)`,
        entity: "device",
        entity_id: device.id,
        business_date: bDate,
      },
    });

    await tx.notification.create({
      data: {
        user_id: device.seller_id,
        event: "device_listed",
        title: "Your device is now listed",
        body: `Your refurbished device has been listed for sale at ₹${basePrice.toLocaleString("en-IN")}.`,
        link: `/sell/${device.submission_id}`,
      },
    });

    return { ok: true, listingId, price: basePrice };
  });
}

// ─── F10: Liquidate device to B2B ────────────────────────────────────────────

export async function liquidateDevice(
  actor: Actor,
  input: z.infer<typeof LiquidateDeviceInput>,
  now: Date,
) {
  requireRole(actor, "ops");
  const parsed = LiquidateDeviceInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const device = await tx.device.findUnique({
      where: { id: parsed.deviceId },
      include: { listing: true },
    });
    if (!device) throw new Error("Device not found.");
    if (device.status !== "day45_review") {
      throw new Error(`Device is ${device.status}, expected day45_review.`);
    }
    if (!device.listing || device.listing.status !== "review") {
      throw new Error("Listing is not in review status.");
    }

    transitionDevice("day45_review", "liquidated");
    transitionListing("review", "liquidated");

    const floorPrice = device.listing.floor_price;

    await tx.listing.update({
      where: { id: device.listing.id },
      data: { status: "liquidated", current_price: floorPrice },
    });

    await tx.device.update({
      where: { id: device.id },
      data: { status: "liquidated" },
    });

    const settings = settingsToDomain(await readSettings(tx));
    const bDate = businessDate(settings, now);

    await tx.activityLog.create({
      data: {
        actor_id: actor.id,
        actor_name: actor.fullName,
        text: `Liquidated device to B2B at floor ₹${floorPrice.toLocaleString("en-IN")}`,
        entity: "device",
        entity_id: device.id,
        business_date: bDate,
      },
    });

    return { ok: true, floorPrice };
  });
}

// ─── Reprice listing ─────────────────────────────────────────────────────────

export async function repriceListing(
  actor: Actor,
  input: z.infer<typeof RepriceListingInput>,
  now: Date,
) {
  requireRole(actor, "ops");
  const parsed = RepriceListingInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const listing = await tx.listing.findUnique({
      where: { id: parsed.listingId },
      include: { device: true },
    });
    if (!listing) throw new Error("Listing not found.");
    if (listing.status !== "active" && listing.status !== "review") {
      throw new Error(`Listing is ${listing.status}, must be active or review.`);
    }
    if (parsed.newPrice < listing.floor_price) {
      throw new Error(`Price ₹${parsed.newPrice} is below floor ₹${listing.floor_price}.`);
    }

    const wasReview = listing.status === "review";
    const listingUpdate: Record<string, unknown> = {
      current_price: parsed.newPrice,
      override_price: null,
      override_by: null,
      override_at: null,
    };

    if (wasReview) {
      transitionListing("review", "active");
      listingUpdate.status = "active";
    }

    await tx.listing.update({ where: { id: listing.id }, data: listingUpdate });

    if (wasReview && listing.device.status === "day45_review") {
      transitionDevice("day45_review", "listed");
      await tx.device.update({
        where: { id: listing.device_id },
        data: { status: "listed" },
      });
    }

    const settings = settingsToDomain(await readSettings(tx));
    const bDate = businessDate(settings, now);

    await tx.activityLog.create({
      data: {
        actor_id: actor.id,
        actor_name: actor.fullName,
        text: `Repriced listing to ₹${parsed.newPrice.toLocaleString("en-IN")}${wasReview ? " (from day-45 review)" : ""}`,
        entity: "listing",
        entity_id: listing.id,
        business_date: bDate,
      },
    });

    return { ok: true, newPrice: parsed.newPrice, reactivated: wasReview };
  });
}

// ─── Set override price ──────────────────────────────────────────────────────

export async function setOverridePrice(
  actor: Actor,
  input: z.infer<typeof SetOverridePriceInput>,
  now: Date,
) {
  requireRole(actor, "ops");
  const parsed = SetOverridePriceInput.parse(input);

  const listing = await prisma.listing.findUnique({ where: { id: parsed.listingId } });
  if (!listing) throw new Error("Listing not found.");
  if (listing.status !== "active") {
    throw new Error(`Listing is ${listing.status}, must be active.`);
  }
  if (parsed.overridePrice !== null && parsed.overridePrice < listing.floor_price) {
    throw new Error(`Override ₹${parsed.overridePrice} is below floor ₹${listing.floor_price}.`);
  }

  await prisma.listing.update({
    where: { id: listing.id },
    data: {
      override_price: parsed.overridePrice,
      override_by: parsed.overridePrice !== null ? actor.id : null,
      override_at: parsed.overridePrice !== null ? now : null,
    },
  });

  const settings = settingsToDomain(await readSettings(prisma));
  const bDate = businessDate(settings, now);

  await prisma.activityLog.create({
    data: {
      actor_id: actor.id,
      actor_name: actor.fullName,
      text: parsed.overridePrice !== null
        ? `Set override price ₹${parsed.overridePrice.toLocaleString("en-IN")}`
        : "Cleared override price",
      entity: "listing",
      entity_id: listing.id,
      business_date: bDate,
    },
  });

  return { ok: true };
}

// ─── Pause IC for model ──────────────────────────────────────────────────────

export async function pauseIcForModel(
  actor: Actor,
  input: z.infer<typeof PauseIcForModelInput>,
  now: Date,
) {
  requireRole(actor, "ops");
  const parsed = PauseIcForModelInput.parse(input);

  await prisma.deviceModel.update({
    where: { id: parsed.deviceModelId },
    data: { ic_paused: parsed.paused },
  });

  const settings = settingsToDomain(await readSettings(prisma));
  const bDate = businessDate(settings, now);

  await prisma.activityLog.create({
    data: {
      actor_id: actor.id,
      actor_name: actor.fullName,
      text: `${parsed.paused ? "Paused" : "Resumed"} Instant Cash for model`,
      entity: "device_model",
      entity_id: parsed.deviceModelId,
      business_date: bDate,
    },
  });

  return { ok: true, paused: parsed.paused };
}
