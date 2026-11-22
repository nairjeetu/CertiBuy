import { prisma } from "@certibuy/db";
import { businessDate, addDays } from "@certibuy/domain";
import { PHOTOS_REQUIRED, submissionStatuses, payoutStatuses } from "@certibuy/contracts";
import type { Actor } from "../actor";
import { requireRole, requireOwner } from "../policy";

type PrismaClient = typeof prisma;

async function readSettings(db: PrismaClient) {
  const s = await db.settings.findUnique({ where: { id: 1 } });
  if (!s) throw new Error("Settings are missing.");
  return s;
}

// ─── getSellerHome ──────────────────────────────────────────────────────────

export async function getSellerHome(actor: Actor) {
  requireRole(actor, "customer");

  const submissions = await prisma.submission.findMany({
    where: { seller_id: actor.id },
    orderBy: { created_at: "desc" },
    include: {
      device_model: { select: { brand: true, model: true, storage: true, category: true, image_url: true } },
      offers: {
        where: { status: { in: ["active", "accepted"] } },
        orderBy: { created_at: "desc" },
        take: 1,
        select: { guaranteed_price: true, instant_cash_amount: true, ic_eligible: true, status: true },
      },
      booking: {
        select: { hub_id: true, date: true, slot: true, status: true },
      },
    },
  });

  return {
    deals: submissions.map((sub) => {
      const offer = sub.offers[0];
      const statusInfo = submissionStatuses[sub.status] ?? { label: sub.status, tone: "neutral" };
      return {
        id: sub.id,
        status: sub.status,
        statusLabel: statusInfo.label,
        statusTone: statusInfo.tone,
        model: {
          brand: sub.device_model.brand,
          name: sub.device_model.model,
          storage: sub.device_model.storage,
          category: sub.device_model.category,
          imageUrl: sub.device_model.image_url,
        },
        offer: offer ? {
          guaranteedPrice: offer.guaranteed_price,
          instantCashAmount: offer.instant_cash_amount,
          icEligible: offer.ic_eligible,
          offerStatus: offer.status,
        } : null,
        chosenOption: sub.chosen_option,
        booking: sub.booking ? {
          date: sub.booking.date,
          slot: sub.booking.slot,
          status: sub.booking.status,
        } : null,
        nextAction: nextActionForSeller(sub.status, sub.chosen_option),
        createdAt: sub.created_at.toISOString(),
      };
    }),
  };
}

// ─── getSubmissionWizard ────────────────────────────────────────────────────

export async function getSubmissionWizard(actor: Actor, submissionId: string) {
  requireRole(actor, "customer");

  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      device_model: { select: { brand: true, model: true, storage: true, category: true, image_url: true } },
    },
  });
  if (!sub) throw new Error("Submission not found.");
  requireOwner(actor, sub.seller_id);

  const photos = sub.photos as unknown as Array<{ key: string; brightness: number; ok: boolean }>;
  const diagnostics = sub.diagnostics as unknown as Record<string, unknown>;
  const category = sub.device_model.category as keyof typeof PHOTOS_REQUIRED;

  return {
    id: sub.id,
    status: sub.status,
    model: {
      brand: sub.device_model.brand,
      name: sub.device_model.model,
      storage: sub.device_model.storage,
      category: sub.device_model.category,
      imageUrl: sub.device_model.image_url,
    },
    imei: sub.imei,
    declaredCosmetic: sub.declared_cosmetic,
    repaired: sub.repaired,
    waterExposure: sub.water_exposure,
    colour: sub.colour,
    ageMonths: sub.age_months,
    billBox: sub.bill_box,
    warrantyStatus: sub.warranty_status,
    photos,
    photosRequired: PHOTOS_REQUIRED[category],
    retakeCount: sub.retake_count,
    diagnostics,
    chosenOption: sub.chosen_option,
    currentOfferId: sub.current_offer_id,
    currentStep: wizardStep(sub.status, photos, diagnostics, category),
  };
}

// ─── getOfferDetail ─────────────────────────────────────────────────────────

export async function getOfferDetail(actor: Actor, submissionId: string) {
  requireRole(actor, "customer");

  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      device_model: { select: { brand: true, model: true, storage: true } },
    },
  });
  if (!sub) throw new Error("Submission not found.");
  requireOwner(actor, sub.seller_id);

  const offer = sub.current_offer_id
    ? await prisma.offer.findUnique({ where: { id: sub.current_offer_id } })
    : null;

  if (!offer) throw new Error("No offer found.");

  const breakdown = offer.breakdown as unknown as Record<string, number>;

  // Amendment 5: seller sees market price, inspection fee, risk, guaranteed, instant_cash.
  // Structurally EXCLUDE commission, floor_price, acquisition_cost.
  return {
    id: offer.id,
    submissionId: sub.id,
    model: {
      brand: sub.device_model.brand,
      name: sub.device_model.model,
      storage: sub.device_model.storage,
    },
    marketPrice: breakdown.market_price,
    inspectionFee: breakdown.inspection_fee,
    riskDeduction: breakdown.risk,
    guaranteedPrice: offer.guaranteed_price,
    instantCashAmount: offer.instant_cash_amount,
    icEligible: offer.ic_eligible,
    icReason: offer.ic_reason,
    riskPct: offer.risk_pct,
    band: offer.priced_band,
    expiresAt: offer.expires_at.toISOString(),
    offerStatus: offer.status,
    chosenOption: sub.chosen_option,
  };
}

// ─── getHubSlots ────────────────────────────────────────────────────────────

export async function getHubSlots(actor: Actor, now: Date) {
  requireRole(actor, "customer");

  const settings = await readSettings(prisma);
  const bDate = businessDate(settings, now);

  const hubs = await prisma.hub.findMany({
    where: { active: true },
    orderBy: { distance_km: "asc" },
  });

  const dates: string[] = [];
  for (let i = 0; i <= 4; i++) {
    dates.push(addDays(bDate, i));
  }

  // Time of day in Asia/Kolkata, as "HH:MM", so today's past slots can be dropped.
  const nowHHMM = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  const result = await Promise.all(
    hubs.map(async (hub) => {
      const bookingCounts = await prisma.booking.groupBy({
        by: ["date"],
        where: {
          hub_id: hub.id,
          date: { in: dates },
          status: "booked",
        },
        _count: { id: true },
      });

      const countMap = new Map(bookingCounts.map((b) => [b.date, b._count.id]));

      return {
        id: hub.id,
        name: hub.name,
        type: hub.type,
        address: hub.address,
        city: hub.city,
        distanceKm: hub.distance_km,
        slotTimes: hub.slot_times,
        dailyCapacity: hub.daily_capacity,
        dates: dates.map((d) => {
          const slots = d === bDate
            ? hub.slot_times.filter((t) => t > nowHHMM)
            : hub.slot_times;
          const booked = countMap.get(d) ?? 0;
          return {
            date: d,
            booked,
            slots,
            available: Math.min(hub.daily_capacity - booked, slots.length),
          };
        }),
      };
    }),
  );

  return { hubs: result, dates };
}

// ─── getDealTracker (S-11) ──────────────────────────────────────────────────

export async function getDealTracker(actor: Actor, submissionId: string) {
  requireRole(actor, "customer");

  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      device_model: { select: { brand: true, model: true, storage: true, category: true, image_url: true } },
      booking: {
        select: { id: true, date: true, slot: true, status: true, hub: { select: { name: true, address: true } } },
      },
      offers: {
        where: { status: { in: ["active", "accepted"] } },
        orderBy: { created_at: "desc" },
        take: 1,
        select: {
          guaranteed_price: true,
          instant_cash_amount: true,
          ic_eligible: true,
          status: true,
          priced_band: true,
          expires_at: true,
        },
      },
    },
  });
  if (!sub) throw new Error("Submission not found.");
  requireOwner(actor, sub.seller_id);

  const report = await prisma.inspectionReport.findUnique({
    where: { submission_id: sub.id },
    select: { computed_grade: true, quoted_amount: true, revised_amount: true, seller_decision: true },
  });

  const payouts = await prisma.payout.findMany({
    where: { seller_id: actor.id, submission_id: sub.id },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      type: true,
      amount: true,
      status: true,
      created_at: true,
    },
  });

  const activities = await prisma.activityLog.findMany({
    where: { entity: "submission", entity_id: sub.id },
    orderBy: { created_at: "desc" },
    take: 20,
    select: { text: true, created_at: true, business_date: true },
  });

  const offer = sub.offers[0];
  const statusInfo = submissionStatuses[sub.status] ?? { label: sub.status, tone: "neutral" };

  return {
    id: sub.id,
    status: sub.status,
    statusLabel: statusInfo.label,
    statusTone: statusInfo.tone,
    model: {
      brand: sub.device_model.brand,
      name: sub.device_model.model,
      storage: sub.device_model.storage,
      category: sub.device_model.category,
      imageUrl: sub.device_model.image_url,
    },
    chosenOption: sub.chosen_option,
    offer: offer ? {
      guaranteedPrice: offer.guaranteed_price,
      instantCashAmount: offer.instant_cash_amount,
      icEligible: offer.ic_eligible,
      offerStatus: offer.status,
      band: offer.priced_band,
      expiresAt: offer.expires_at.toISOString(),
    } : null,
    booking: sub.booking ? {
      id: sub.booking.id,
      date: sub.booking.date,
      slot: sub.booking.slot,
      status: sub.booking.status,
      hubName: sub.booking.hub.name,
      hubAddress: sub.booking.hub.address,
    } : null,
    payouts: payouts.map((p) => ({
      id: p.id,
      type: p.type,
      amount: p.amount,
      status: p.status,
      statusLabel: (payoutStatuses[p.status] ?? { label: p.status }).label,
      createdAt: p.created_at.toISOString(),
    })),
    timeline: activities.map((a) => ({
      text: a.text,
      date: a.business_date,
      createdAt: a.created_at.toISOString(),
    })),
    revisedOffer: (sub.status === "revised_offer" && report?.revised_amount) ? {
      quotedAmount: report.quoted_amount,
      revisedAmount: report.revised_amount,
      computedGrade: report.computed_grade,
      sellerDecision: report.seller_decision,
    } : null,
    nextAction: nextActionForSeller(sub.status, sub.chosen_option),
  };
}

// ─── getSellerPayouts (S-13) ────────────────────────────────────────────────

export async function getSellerPayouts(actor: Actor) {
  requireRole(actor, "customer");

  const payouts = await prisma.payout.findMany({
    where: { seller_id: actor.id },
    orderBy: { created_at: "desc" },
    include: {
      device: {
        select: {
          device_model: { select: { brand: true, model: true, storage: true } },
        },
      },
    },
  });

  return {
    payouts: payouts.map((p) => ({
      id: p.id,
      type: p.type,
      amount: p.amount,
      status: p.status,
      statusLabel: (payoutStatuses[p.status] ?? { label: p.status }).label,
      trigger: p.trigger,
      model: p.device ? {
        brand: p.device.device_model.brand,
        name: p.device.device_model.model,
        storage: p.device.device_model.storage,
      } : null,
      createdAt: p.created_at.toISOString(),
    })),
  };
}

// ─── getDeviceCatalogue (S-02 model picker) ─────────────────────────────────

export async function getDeviceCatalogue(actor: Actor) {
  requireRole(actor, "customer");

  const settings = await readSettings(prisma);

  const models = await prisma.deviceModel.findMany({
    where: { active: true },
    orderBy: [{ brand: "asc" }, { model: "asc" }],
  });

  const brands = [...new Set(models.map((m) => m.brand))].sort();
  const categories = [...new Set(models.map((m) => m.category))].sort();

  return {
    models: models.map((m) => ({
      id: m.id,
      brand: m.brand,
      model: m.model,
      storage: m.storage,
      category: m.category,
      imageUrl: m.image_url,
      marketPriceA: m.market_price_a,
      inPriceBand: m.market_price_a >= settings.price_band_min && m.market_price_a <= settings.price_band_max,
      priceBandReason: m.market_price_a < settings.price_band_min
        ? "Below minimum price"
        : m.market_price_a > settings.price_band_max
          ? "Above maximum price"
          : null,
    })),
    brands,
    categories,
  };
}

// ─── getWorkspaceContext ─────────────────────────────────────────────────────

export async function getWorkspaceContext(now: Date) {
  const settings = await readSettings(prisma);
  const bDate = businessDate(settings, now);

  return {
    settings: {
      photoMinPx: settings.photo_min_px,
      photoMinBrightness: settings.photo_min_brightness,
      photoRetakeMedium: settings.photo_retake_medium,
      offerExpiryDays: settings.offer_expiry_days,
      returnWindowDays: settings.return_window_days,
      warrantyMonths: settings.warranty_months,
      batteryAMin: settings.battery_a_min,
      batteryBMin: settings.battery_b_min,
      batteryCMin: settings.battery_c_min,
    },
    businessDate: bDate,
    demoMode: settings.demo_mode,
    integrations: {
      payments: "simulated",
      payouts: "simulated",
      courier: "simulated",
      grading: "simulated",
      mail: "simulated",
    },
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function nextActionForSeller(status: string, chosenOption: string | null): string {
  switch (status) {
    case "draft":
      return "Complete your submission";
    case "graded":
      return "Review your offer";
    case "offer_accepted":
      return "Book an inspection";
    case "scheduled":
      return "Visit the hub for inspection";
    case "inspected":
      return chosenOption === "sell_for_more" ? "Wait for your device to sell" : "Payout processing";
    case "revised_offer":
      return "Review revised offer";
    case "accepted":
      return "Deal complete";
    case "rejected":
      return "Submission rejected";
    case "abandoned":
      return "Submission cancelled";
    default:
      return "";
  }
}

function wizardStep(
  status: string,
  photos: unknown[],
  diagnostics: Record<string, unknown>,
  category: keyof typeof PHOTOS_REQUIRED,
): string {
  if (status !== "draft") return "done";
  if (!photos || photos.length < PHOTOS_REQUIRED[category]) {
    if (Object.keys(diagnostics).length > 0 && diagnostics.battery !== undefined) return "photos";
    return "details";
  }
  if (!diagnostics || !diagnostics.battery) return "diagnostics";
  return "ready";
}
