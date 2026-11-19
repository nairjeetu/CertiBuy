import { prisma } from "@certibuy/db";
import { businessDate } from "@certibuy/domain";
import type { Settings } from "@certibuy/domain";
import type { Actor } from "../actor";
import { requireRole } from "../policy";

function parsePagination(params: Record<string, string>, defaultTake = 50) {
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const take = Math.min(100, Math.max(1, parseInt(params.limit || String(defaultTake), 10) || defaultTake));
  const skip = (page - 1) * take;
  return { skip, take, page };
}

async function readSettings() {
  const s = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!s) throw new Error("Settings are missing.");
  return s;
}

function bDate(settings: { sim_day_offset: number }, now: Date) {
  return businessDate(settings as unknown as Settings, now);
}

// ─── O-01: Overview ───────────────────────────────────────────────────────

export async function getOpsOverview(actor: Actor, _params: Record<string, string>, now: Date) {
  requireRole(actor, "ops");
  const settings = await readSettings();
  const today = bDate(settings, now);

  const [
    activeListings, pendingPayouts, openExceptions, todayBookings,
    totalDevices, activeOrders, pendingReturns, registeredUsers,
    hubCount, catalogueModels, totalSubmissions, reservedListings,
    recentActivity,
  ] = await Promise.all([
    prisma.listing.count({ where: { status: "active" } }),
    prisma.payout.count({ where: { status: { in: ["pending", "approved"] } } }),
    prisma.exceptionCase.count({ where: { status: "open" } }),
    prisma.booking.count({ where: { status: "booked", date: today } }),
    prisma.device.count({ where: { owner: "certibuy" } }),
    prisma.order.count({ where: { status: { in: ["paid", "dispatched", "in_transit"] } } }),
    prisma.returnRequest.count({ where: { status: { in: ["awaiting_reinspection", "awaiting_decision"] } } }),
    prisma.profile.count(),
    prisma.hub.count({ where: { active: true } }),
    prisma.deviceModel.count(),
    prisma.submission.count(),
    prisma.listing.count({ where: { status: "reserved" } }),
    prisma.activityLog.findMany({ orderBy: { created_at: "desc" }, take: 10 }),
  ]);

  return {
    businessDate: today,
    kpi: {
      activeListings, pendingPayouts, openExceptions, todayBookings,
      totalDevices, activeOrders, pendingReturns, registeredUsers,
      hubCount, catalogueModels, totalSubmissions, reservedListings,
    },
    recentActivity: recentActivity.map(a => ({
      id: a.id,
      actor_name: a.actor_name,
      text: a.text,
      entity: a.entity,
      entity_id: a.entity_id,
      business_date: a.business_date,
      created_at: a.created_at,
    })),
  };
}

// ─── O-02: Alerts ─────────────────────────────────────────────────────────

export async function getAlerts(actor: Actor, params: Record<string, string>) {
  requireRole(actor, "ops");
  const type = params.type || undefined;
  const exceptions = await prisma.exceptionCase.findMany({
    where: { status: "open", ...(type ? { type: type as never } : {}) },
    orderBy: { created_at: "desc" },
    take: 50,
  });

  const reviewDevices = await prisma.device.findMany({
    where: { status: "day45_review" },
    include: {
      device_model: { select: { brand: true, model: true, storage: true } },
      listing: { select: { id: true, floor_price: true, current_price: true } },
    },
    orderBy: { created_at: "asc" },
    take: 50,
  });

  return {
    exceptions,
    reviewDevices: reviewDevices.map(d => ({
      id: d.id,
      tag_id: d.tag_id,
      brand: d.device_model.brand,
      model: d.device_model.model,
      storage: d.device_model.storage,
      final_grade: d.final_grade,
      floor_price: d.listing?.floor_price ?? 0,
      current_price: d.listing?.current_price ?? 0,
      listing_id: d.listing?.id ?? null,
    })),
  };
}

// ─── O-03: Catalogue ──────────────────────────────────────────────────────

export async function getCatalogue(actor: Actor) {
  requireRole(actor, "ops");
  const models = await prisma.deviceModel.findMany({
    orderBy: { brand: "asc" },
    take: 200,
    include: { liquidity_scores: { where: { is_current: true }, take: 1 } },
  });
  return {
    models: models.map(m => ({
      id: m.id,
      brand: m.brand,
      model: m.model,
      storage: m.storage,
      category: m.category,
      original_price: m.original_price,
      market_price_a: m.market_price_a,
      b2b_floor_price: m.b2b_floor_price,
      liquidity_tier: m.liquidity_tier,
      ic_paused: m.ic_paused,
      active: m.active,
      liquidity_score: m.liquidity_scores[0]?.score ?? null,
    })),
  };
}

// ─── O-04: Pricing / Settings ─────────────────────────────────────────────

export async function getPricingSettings(actor: Actor) {
  requireRole(actor, "ops");
  const settings = await readSettings();
  const { created_at, updated_at, ...rest } = settings;
  return { settings: rest };
}

// ─── O-05: Liquidity board ────────────────────────────────────────────────

export async function getLiquidityBoard(actor: Actor) {
  requireRole(actor, "ops");
  const models = await prisma.deviceModel.findMany({
    where: { active: true },
    include: { liquidity_scores: { where: { is_current: true }, take: 1 } },
    orderBy: { brand: "asc" },
    take: 200,
  });
  return {
    models: models.map(m => ({
      id: m.id,
      brand: m.brand,
      model: m.model,
      storage: m.storage,
      liquidity_tier: m.liquidity_tier,
      score: m.liquidity_scores[0]?.score ?? null,
      days_to_sell: m.liquidity_scores[0]?.days_to_sell ?? null,
      volatility: m.liquidity_scores[0]?.volatility ?? null,
      source: m.liquidity_scores[0]?.source ?? null,
    })),
  };
}

// ─── O-06: Inventory ──────────────────────────────────────────────────────

export async function getInventory(actor: Actor, params: Record<string, string>) {
  requireRole(actor, "ops");
  const statusFilter = params.status || undefined;
  const where = statusFilter ? { status: statusFilter as never } : {};
  const { skip, take, page } = parsePagination(params);
  const [devices, total] = await Promise.all([
    prisma.device.findMany({
      where,
      include: {
        device_model: { select: { brand: true, model: true, storage: true, b2b_floor_price: true } },
        listing: {
          select: {
            id: true, base_price: true, current_price: true, floor_price: true,
            override_price: true, listed_at: true, warranty_months: true,
            ladder_step: true, status: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      skip,
      take,
    }),
    prisma.device.count({ where }),
  ]);
  return {
    page,
    total,
    devices: devices.map(d => ({
      id: d.id,
      imei: d.imei,
      tag_id: d.tag_id,
      brand: d.device_model.brand,
      model: d.device_model.model,
      storage: d.device_model.storage,
      final_grade: d.final_grade,
      status: d.status,
      payout_option: d.payout_option,
      acquisition_cost: d.acquisition_cost,
      parts_replaced: d.parts_replaced,
      device_model_id: d.device_model_id,
      listing_id: d.listing?.id ?? null,
      listing_price: d.listing?.current_price ?? null,
      listing_base_price: d.listing?.base_price ?? null,
      listing_floor_price: d.listing?.floor_price ?? null,
      listing_override_price: d.listing?.override_price ?? null,
      listing_listed_at: d.listing?.listed_at ?? null,
      listing_warranty_months: d.listing?.warranty_months ?? null,
      listing_ladder_step: d.listing?.ladder_step ?? null,
      listing_status: d.listing?.status ?? null,
      b2b_floor_price: d.device_model.b2b_floor_price,
      created_at: d.created_at,
    })),
  };
}

// ─── O-07: Exceptions ─────────────────────────────────────────────────────

export async function getExceptions(actor: Actor, params: Record<string, string>) {
  requireRole(actor, "ops");
  const statusFilter = params.status || undefined;
  const where = statusFilter ? { status: statusFilter as never } : {};
  const { skip, take, page } = parsePagination(params);
  const [exceptions, total] = await Promise.all([
    prisma.exceptionCase.findMany({ where, orderBy: { created_at: "desc" }, skip, take }),
    prisma.exceptionCase.count({ where }),
  ]);
  return { exceptions, page, total };
}

// ─── O-08: Hubs ───────────────────────────────────────────────────────────

export async function getHubList(actor: Actor, _params: Record<string, string>, now: Date) {
  requireRole(actor, "ops");
  const settings = await readSettings();
  const today = bDate(settings, now);

  const hubs = await prisma.hub.findMany({ orderBy: { name: "asc" } });
  const hubsWithBookings = await Promise.all(
    hubs.map(async h => {
      const todayBookings = await prisma.booking.count({
        where: { hub_id: h.id, date: today, status: "booked" },
      });
      return {
        id: h.id,
        name: h.name,
        type: h.type,
        city: h.city,
        daily_capacity: h.daily_capacity,
        todayBookings,
      };
    }),
  );
  return { hubs: hubsWithBookings };
}

// ─── O-09: Users ──────────────────────────────────────────────────────────

export async function getUserList(actor: Actor, params: Record<string, string>) {
  requireRole(actor, "ops");
  const roleFilter = params.role || undefined;
  const where = roleFilter ? { app_role: roleFilter as never } : {};
  const { skip, take, page } = parsePagination(params);
  const [profiles, total] = await Promise.all([
    prisma.profile.findMany({ where, orderBy: { created_at: "desc" }, skip, take }),
    prisma.profile.count({ where }),
  ]);
  return {
    page,
    total,
    users: profiles.map(p => ({
      id: p.id,
      full_name: p.full_name,
      app_role: p.app_role,
      active_mode: p.active_mode,
      trust_score: p.trust_score,
      return_count: p.return_count,
      account_flagged: p.account_flagged,
      is_platform_admin: p.is_platform_admin,
      hub_id: p.hub_id,
      created_at: p.created_at,
    })),
  };
}

// ─── O-10: Metrics ────────────────────────────────────────────────────────

export async function getMetricsData(actor: Actor) {
  requireRole(actor, "ops");
  const snapshots = await prisma.metricSnapshot.findMany({
    orderBy: [{ metric_name: "asc" }, { week_start: "asc" }],
  });
  const grouped: Record<string, Array<{ week_start: string; value: number }>> = {};
  for (const s of snapshots) {
    if (!grouped[s.metric_name]) grouped[s.metric_name] = [];
    grouped[s.metric_name]!.push({ week_start: s.week_start, value: s.value });
  }
  return { metrics: grouped };
}

// ─── O-11: Demo controls ─────────────────────────────────────────────────

export async function getDemoControls(actor: Actor, _params: Record<string, string>, now: Date) {
  requireRole(actor, "ops");
  const settings = await readSettings();
  const today = bDate(settings, now);
  return {
    demo_mode: settings.demo_mode,
    sim_day_offset: settings.sim_day_offset,
    simulate_payout_failure: settings.simulate_payout_failure,
    businessDate: today,
  };
}

// ─── O-12: Job history ────────────────────────────────────────────────────

export async function getJobHistory(actor: Actor, params: Record<string, string>) {
  requireRole(actor, "ops");
  const { skip, take, page } = parsePagination(params);
  const [jobs, total] = await Promise.all([
    prisma.jobRun.findMany({ orderBy: { updated_at: "desc" }, skip, take }),
    prisma.jobRun.count(),
  ]);
  return { jobs, page, total };
}

// ─── O-13: Support inbox ──────────────────────────────────────────────────

export async function getSupportInbox(actor: Actor, params: Record<string, string>) {
  requireRole(actor, "ops");
  const statusFilter = params.status || undefined;
  const requests = await prisma.supportRequest.findMany({
    where: statusFilter ? { status: statusFilter as never } : {},
    orderBy: { created_at: "desc" },
    take: 50,
  });
  return { requests };
}

// ─── O-14: Audit log ──────────────────────────────────────────────────────

export async function getAuditLog(actor: Actor, params: Record<string, string>) {
  requireRole(actor, "ops");
  const where = params.date ? { business_date: params.date } : {};
  const { skip, take, page } = parsePagination(params, 100);
  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({ where, orderBy: { created_at: "desc" }, skip, take }),
    prisma.activityLog.count({ where }),
  ]);
  return { logs, page, total };
}

// ─── O-15: Mail / notification log ────────────────────────────────────────

export async function getMailLog(actor: Actor, params: Record<string, string>) {
  requireRole(actor, "ops");
  const { skip, take, page } = parsePagination(params, 100);
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({ orderBy: { created_at: "desc" }, skip, take }),
    prisma.notification.count(),
  ]);
  return { notifications, page, total };
}
