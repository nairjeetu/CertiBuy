import { prisma, Prisma } from "@certibuy/db";
import {
  GradeSubmissionInput,
  ComputeOfferInput,
  IcEligibilityInput,
  AcceptOfferInput,
  ManageBookingInput,
  BookInspectionInput,
  SaveSubmissionDetailsInput,
  SaveDiagnosticsInput,
  PHOTOS_REQUIRED,
} from "@certibuy/contracts";
import type { z } from "zod";
import {
  checkRejects,
  assess,
  gradePrice,
  computeOffer as computeOfferDomain,
  riskPct,
  icEligibility as icEligibilityDomain,
  businessDate,
  addDays,
  diffDays,
} from "@certibuy/domain";
import type { Actor } from "../actor";
import { requireRole, requireOwner } from "../policy";

type PrismaClient = typeof prisma;
type PrismaTx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

import { toDate } from "../util";

async function readSettings(tx: PrismaTx) {
  const s = await tx.settings.findUnique({ where: { id: 1 } });
  if (!s) throw new Error("Settings are missing.");
  return s;
}

// ─── saveSubmissionDetails (create or update draft) ─────────────────────────

export async function saveSubmissionDetails(
  actor: Actor,
  input: z.infer<typeof SaveSubmissionDetailsInput>,
  _now: Date,
) {
  requireRole(actor, "customer");
  const parsed = SaveSubmissionDetailsInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const model = await tx.deviceModel.findUnique({
      where: { id: parsed.deviceModelId },
    });
    if (!model || !model.active) throw new Error("Device model not available.");

    if (parsed.submissionId) {
      const existing = await tx.submission.findUnique({
        where: { id: parsed.submissionId },
      });
      if (!existing) throw new Error("Submission not found.");
      requireOwner(actor, existing.seller_id);
      if (existing.status !== "draft") {
        throw new Error("Submission is no longer a draft.");
      }
      return tx.submission.update({
        where: { id: parsed.submissionId },
        data: {
          device_model_id: parsed.deviceModelId,
          imei: parsed.imei,
          declared_cosmetic: parsed.declaredCosmetic,
          repaired: parsed.repaired,
          water_exposure: parsed.waterExposure,
          colour: parsed.colour,
          age_months: parsed.ageMonths,
          bill_box: parsed.billBox,
          warranty_status: parsed.warrantyStatus,
        },
      });
    }

    return tx.submission.create({
      data: {
        seller_id: actor.id,
        device_model_id: parsed.deviceModelId,
        imei: parsed.imei,
        declared_cosmetic: parsed.declaredCosmetic,
        repaired: parsed.repaired,
        water_exposure: parsed.waterExposure,
        colour: parsed.colour,
        age_months: parsed.ageMonths,
        bill_box: parsed.billBox,
        warranty_status: parsed.warrantyStatus,
        status: "draft",
      },
    });
  });
}

// ─── saveDiagnostics ────────────────────────────────────────────────────────

export async function saveDiagnostics(
  actor: Actor,
  input: z.infer<typeof SaveDiagnosticsInput>,
) {
  requireRole(actor, "customer");
  const parsed = SaveDiagnosticsInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({
      where: { id: parsed.submissionId },
    });
    if (!sub) throw new Error("Submission not found.");
    requireOwner(actor, sub.seller_id);
    if (sub.status !== "draft") throw new Error("Submission is no longer a draft.");

    return tx.submission.update({
      where: { id: parsed.submissionId },
      data: { diagnostics: JSON.parse(JSON.stringify(parsed.diagnostics)) },
    });
  });
}

// ─── gradeSubmission (S-06) ─────────────────────────────────────────────────

export async function gradeSubmission(
  actor: Actor,
  input: z.infer<typeof GradeSubmissionInput>,
  now: Date,
) {
  requireRole(actor, "customer");
  const parsed = GradeSubmissionInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({
      where: { id: parsed.submissionId },
      include: { device_model: true },
    });
    if (!sub) throw new Error("Submission not found.");
    requireOwner(actor, sub.seller_id);
    if (sub.status !== "draft") {
      throw new Error("Submission has already been graded.");
    }

    const settings = await readSettings(tx);

    // F5: server-side photo count check
    const photos = sub.photos as unknown as Array<{ key: string; brightness: number; ok: boolean }>;
    const category = sub.device_model.category as keyof typeof PHOTOS_REQUIRED;
    const required = PHOTOS_REQUIRED[category];
    if (!photos || photos.length < required) {
      throw new Error(
        `${required} photos are required for a ${category}. You have ${photos?.length ?? 0}.`,
      );
    }

    // Check blacklist
    const blacklisted = await tx.blacklistedImei.findUnique({
      where: { imei: sub.imei },
    });

    const diagnostics = sub.diagnostics as unknown as {
      battery: "pass" | "fail";
      screen: "pass" | "fail";
      speakers: "pass" | "fail";
      microphone: "pass" | "fail";
      cameras: "pass" | "fail";
      charging: "pass" | "fail";
      sensors: "pass" | "fail";
      imei_blacklist: "pass" | "fail";
      activation_lock: "pass" | "fail" | "on" | "off";
      battery_health: number;
    };

    const domainSub = {
      id: sub.id,
      seller_id: sub.seller_id,
      device_model_id: sub.device_model_id,
      imei: sub.imei,
      declared_cosmetic: sub.declared_cosmetic,
      repaired: sub.repaired as "no" | "authorised" | "other_shop" | "not_sure",
      water_exposure: sub.water_exposure,
      diagnostics,
      photos,
      retake_count: sub.retake_count,
      category: sub.device_model.category as "phone" | "laptop" | "tablet" | "watch",
    };

    const rejectResult = checkRejects(domainSub, !!blacklisted);
    if (rejectResult) {
      await tx.submission.update({
        where: { id: sub.id },
        data: { status: "rejected", reject_reason: rejectResult.reason },
      });
      return { ok: false, rejected: true, code: rejectResult.code, reason: rejectResult.reason };
    }

    // Run the deterministic grader
    const assessment = assess(domainSub, settings);

    // Compute offer
    const marketPrice = gradePrice(sub.device_model, assessment.estimate, settings);
    const risk = riskPct(
      await currentLiquidityScore(tx, sub.device_model_id),
      settings,
    );
    const offer = computeOfferDomain(marketPrice, risk, settings);

    // IC eligibility (amendment 6: delegate to domain, preserve gate order)
    const liqScore = await tx.liquidityScore.findFirst({
      where: { device_model_id: sub.device_model_id, is_current: true },
    });
    const totalExposure = await computeTotalExposure(tx);
    const modelExposure = await computeModelExposure(tx, sub.device_model_id);
    const bDate = businessDate(settings, now);
    const launchWindow = sub.device_model.successor_launch_date != null &&
      (() => {
        const d = diffDays(bDate, sub.device_model.successor_launch_date!);
        return d >= 0 && d <= settings.launch_window_days;
      })();

    const icResult = icEligibilityDomain({
      ic_paused: sub.device_model.ic_paused,
      confidence: assessment.confidence,
      score: liqScore?.score ?? 0,
      launch_window: launchWindow,
      total_exposure: totalExposure,
      model_exposure: modelExposure,
      settings,
    });

    // Write grade assessment
    await tx.gradeAssessment.create({
      data: {
        submission_id: sub.id,
        seller_id: sub.seller_id,
        source: "ai",
        band: assessment.band,
        estimate: assessment.estimate,
        confidence: assessment.confidence_numeric,
        confidence_level: assessment.confidence,
        factors: assessment.factors,
      },
    });

    // Write offer (with settings_version and expiry)
    const expiresAtIso = addDays(bDate, settings.offer_expiry_days) + "T23:59:59.999Z";
    const expiresAt = toDate(expiresAtIso);
    const offerRow = await tx.offer.create({
      data: {
        submission_id: sub.id,
        seller_id: sub.seller_id,
        version: 1,
        priced_band: assessment.band,
        instant_cash_amount: offer.instantCash,
        guaranteed_price: offer.guaranteed,
        ic_eligible: icResult.eligible,
        ic_reason: icResult.reason,
        risk_pct: risk,
        risk_tier: icResult.tier === "Fast-selling" ? "low" : "medium",
        breakdown: offer.breakdown as never,
        settings_version: settings.version,
        expires_at: expiresAt,
        status: "active",
      },
    });

    await tx.submission.update({
      where: { id: sub.id },
      data: { status: "graded", current_offer_id: offerRow.id },
    });

    // Activity log
    await tx.activityLog.create({
      data: {
        actor_id: actor.id,
        actor_name: actor.fullName,
        text: `Submission graded: ${assessment.estimate} (${assessment.confidence})`,
        entity: "submission",
        entity_id: sub.id,
        business_date: bDate,
      },
    });

    // Notification
    await tx.notification.create({
      data: {
        user_id: sub.seller_id,
        event: "submission_graded",
        title: "Your device has been graded",
        body: `Estimated grade: ${assessment.estimate}. See your offer.`,
        link: `/seller/sell/${sub.id}/offer`,
        dedupe_key: `graded_${sub.id}`,
      },
    });

    return {
      ok: true,
      assessment: {
        estimate: assessment.estimate,
        band: assessment.band,
        confidence: assessment.confidence,
        confidence_numeric: assessment.confidence_numeric,
        factors: assessment.factors,
      },
      band: assessment.band,
      confidence: assessment.confidence,
      factors: assessment.factors,
      valueRange: {
        low: gradePrice(sub.device_model, assessment.band[assessment.band.length - 1]!, settings),
        high: gradePrice(sub.device_model, assessment.band[0]!, settings),
      },
      offer: {
        id: offerRow.id,
        guaranteed_price: offer.guaranteed,
        instant_cash_amount: offer.instantCash,
        ic_eligible: icResult.eligible,
        ic_reason: icResult.reason,
        risk_pct: risk,
        expires_at: expiresAt.toISOString(),
      },
      guaranteedPrice: offer.guaranteed,
      instantCashAmount: offer.instantCash,
    };
  });
}

// ─── computeOffer (S-07, re-price without re-grading) ──────────────────────

export async function recomputeOffer(
  actor: Actor,
  input: z.infer<typeof ComputeOfferInput>,
  now: Date,
) {
  requireRole(actor, "customer");
  const parsed = ComputeOfferInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({
      where: { id: parsed.submissionId },
      include: { device_model: true },
    });
    if (!sub) throw new Error("Submission not found.");
    requireOwner(actor, sub.seller_id);

    const settings = await readSettings(tx);
    const bDate = businessDate(settings, now);

    const lastAssessment = await tx.gradeAssessment.findFirst({
      where: { submission_id: sub.id, source: "ai" },
      orderBy: { created_at: "desc" },
    });
    if (!lastAssessment) throw new Error("No grade assessment found.");

    const band = (parsed.band ?? lastAssessment.band) as Array<"A" | "B" | "C" | "D">;
    const estimate = band[0]!;

    const marketPrice = gradePrice(sub.device_model, estimate, settings);
    const score = await currentLiquidityScore(tx, sub.device_model_id);
    const risk = riskPct(score, settings);
    const offer = computeOfferDomain(marketPrice, risk, settings);

    const prevOfferCount = await tx.offer.count({ where: { submission_id: sub.id } });
    const expiresAt = toDate(addDays(bDate, settings.offer_expiry_days) + "T23:59:59.999Z");

    const offerRow = await tx.offer.create({
      data: {
        submission_id: sub.id,
        seller_id: sub.seller_id,
        version: prevOfferCount + 1,
        priced_band: band,
        instant_cash_amount: offer.instantCash,
        guaranteed_price: offer.guaranteed,
        ic_eligible: false,
        ic_reason: null,
        risk_pct: risk,
        risk_tier: "medium",
        breakdown: offer.breakdown as never,
        settings_version: settings.version,
        expires_at: expiresAt,
        status: "active",
      },
    });

    await tx.submission.update({
      where: { id: sub.id },
      data: { current_offer_id: offerRow.id },
    });

    return offerRow;
  });
}

// ─── icEligibility (S-08) — amendment 6 ─────────────────────────────────────

export async function checkIcEligibility(
  actor: Actor,
  input: z.infer<typeof IcEligibilityInput>,
  now: Date,
) {
  requireRole(actor, "customer");
  const parsed = IcEligibilityInput.parse(input);

  const settings = await readSettings(prisma);
  const bDate = businessDate(settings, now);

  const model = await prisma.deviceModel.findUnique({ where: { id: parsed.modelId } });
  if (!model) throw new Error("Device model not found.");

  const liqScore = await prisma.liquidityScore.findFirst({
    where: { device_model_id: parsed.modelId, is_current: true },
  });

  const totalExposure = await computeTotalExposure(prisma);
  const modelExposure = await computeModelExposure(prisma, parsed.modelId);

  const launchWindow = model.successor_launch_date != null &&
    (() => {
      const d = diffDays(bDate, model.successor_launch_date!);
      return d >= 0 && d <= settings.launch_window_days;
    })();

  const result = icEligibilityDomain({
    ic_paused: model.ic_paused,
    confidence: parsed.confidence ?? "High",
    score: liqScore?.score ?? 0,
    launch_window: launchWindow,
    total_exposure: totalExposure,
    model_exposure: modelExposure,
    settings,
  });

  return {
    eligible: result.eligible,
    score: liqScore?.score ?? 0,
    threshold: result.effective_threshold,
    launchWindow,
    riskPct: result.risk_pct,
    tier: result.tier,
    reason: result.reason,
    reasonLabel: result.reason,
    inventoryTotal: totalExposure,
    modelExposure,
  };
}

// ─── acceptOffer (S-09) — amendments 1, 3 ───────────────────────────────────

export async function acceptOffer(
  actor: Actor,
  input: z.infer<typeof AcceptOfferInput>,
  now: Date,
) {
  requireRole(actor, "customer");
  const parsed = AcceptOfferInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({
      where: { id: parsed.submissionId },
      include: { device_model: true },
    });
    if (!sub) throw new Error("Submission not found.");
    requireOwner(actor, sub.seller_id);

    if (sub.status !== "graded") {
      throw new Error("This submission cannot accept an offer right now.");
    }
    if (!sub.current_offer_id) throw new Error("No active offer found.");

    const settings = await readSettings(tx);
    const bDate = businessDate(settings, now);

    const offer = await tx.offer.findUnique({ where: { id: sub.current_offer_id } });
    if (!offer || offer.status !== "active") throw new Error("No active offer found.");

    // Amendment 3: check expiry against business date
    const expiryDate = offer.expires_at.toISOString().slice(0, 10);
    if (bDate > expiryDate) {
      await tx.offer.update({ where: { id: offer.id }, data: { status: "expired" } });
      throw Object.assign(new Error("This offer has expired."), { statusCode: 409 });
    }

    if (parsed.option === "instant_cash") {
      // Amendment 1: advisory lock around IC exposure check
      await tx.$queryRaw(Prisma.sql`SELECT pg_advisory_xact_lock(1001)`);

      const totalExposure = await computeTotalExposure(tx);
      const modelExposure = await computeModelExposure(tx, sub.device_model_id);

      const liqScore = await tx.liquidityScore.findFirst({
        where: { device_model_id: sub.device_model_id, is_current: true },
      });

      const launchWindow = sub.device_model.successor_launch_date != null &&
        (() => {
          const d = diffDays(bDate, sub.device_model.successor_launch_date!);
          return d >= 0 && d <= settings.launch_window_days;
        })();

      const icResult = icEligibilityDomain({
        ic_paused: sub.device_model.ic_paused,
        confidence: offer.ic_eligible ? "High" : "Low",
        score: liqScore?.score ?? 0,
        launch_window: launchWindow,
        total_exposure: totalExposure,
        model_exposure: modelExposure,
        settings,
      });

      if (!icResult.eligible) {
        throw new Error(
          "Instant Cash is no longer available for this device. Choose Sell For More.",
        );
      }
    }

    // Expire other live offers for this submission
    await tx.offer.updateMany({
      where: { submission_id: sub.id, status: "active", id: { not: offer.id } },
      data: { status: "expired" },
    });

    await tx.offer.update({
      where: { id: offer.id },
      data: { status: "accepted" },
    });

    await tx.submission.update({
      where: { id: sub.id },
      data: {
        status: "offer_accepted",
        chosen_option: parsed.option,
        consent_at: now,
      },
    });

    await tx.activityLog.create({
      data: {
        actor_id: actor.id,
        actor_name: actor.fullName,
        text: `Offer accepted: ${parsed.option}`,
        entity: "submission",
        entity_id: sub.id,
        business_date: bDate,
      },
    });

    await tx.notification.create({
      data: {
        user_id: sub.seller_id,
        event: "offer_accepted",
        title: "Offer accepted",
        body: `You chose ${parsed.option === "instant_cash" ? "Instant Cash" : "Sell For More"}. Book an inspection.`,
        link: `/seller/sell/${sub.id}/hub`,
        dedupe_key: `accepted_${sub.id}`,
      },
    });

    const amount = parsed.option === "instant_cash"
      ? offer.instant_cash_amount
      : offer.guaranteed_price;

    return {
      ok: true,
      option: parsed.option,
      amount,
      expiresAt: offer.expires_at.toISOString(),
    };
  });
}

// ─── manageBooking (S-12 edit) ──────────────────────────────────────────────

export async function manageBooking(
  actor: Actor,
  input: z.infer<typeof ManageBookingInput>,
  now: Date,
) {
  requireRole(actor, "customer");
  const parsed = ManageBookingInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({
      where: { id: parsed.submissionId },
    });
    if (!sub) throw new Error("Submission not found.");
    requireOwner(actor, sub.seller_id);

    const settings = await readSettings(tx);
    const bDate = businessDate(settings, now);

    if (parsed.action === "switch_to_guaranteed") {
      if (sub.chosen_option === "sell_for_more") {
        throw new Error("Already on Sell For More.");
      }
      await tx.submission.update({
        where: { id: sub.id },
        data: { chosen_option: "sell_for_more" },
      });
      return { ok: true, option: "sell_for_more" };
    }

    // cancel: cancel live bookings, back to offer_accepted
    const booking = await tx.booking.findUnique({
      where: { submission_id: sub.id },
    });
    if (booking && booking.status === "booked") {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "cancelled" },
      });
    }

    if (sub.status === "scheduled") {
      await tx.submission.update({
        where: { id: sub.id },
        data: { status: "offer_accepted" },
      });
    }

    await tx.activityLog.create({
      data: {
        actor_id: actor.id,
        actor_name: actor.fullName,
        text: "Booking cancelled",
        entity: "submission",
        entity_id: sub.id,
        business_date: bDate,
      },
    });

    return { ok: true, released: true };
  });
}

// ─── bookInspection (S-12) — amendment 2 ────────────────────────────────────

export async function bookInspection(
  actor: Actor,
  input: z.infer<typeof BookInspectionInput>,
  now: Date,
) {
  requireRole(actor, "customer");
  const parsed = BookInspectionInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({
      where: { id: parsed.submissionId },
    });
    if (!sub) throw new Error("Submission not found.");
    requireOwner(actor, sub.seller_id);

    if (sub.status !== "offer_accepted" && sub.status !== "scheduled") {
      throw new Error("Choose a payout option before booking.");
    }
    if (!sub.chosen_option) throw new Error("Choose a payout option first.");

    const settings = await readSettings(tx);
    const bDate = businessDate(settings, now);

    // Validate date is within next 5 days
    const dayDiff = diffDays(bDate, parsed.date);
    if (dayDiff < 0 || dayDiff > 5) {
      throw new Error("Booking date must be within the next 5 days.");
    }

    const hub = await tx.hub.findUnique({ where: { id: parsed.hubId } });
    if (!hub || !hub.active) throw new Error("Hub not available.");

    if (!hub.slot_times.includes(parsed.slot)) {
      throw new Error("Invalid time slot for this hub.");
    }

    // Amendment 2: advisory lock on (hub, date) before capacity check
    const lockKey = hashLockKey(parsed.hubId, parsed.date);
    await tx.$queryRaw(Prisma.sql`SELECT pg_advisory_xact_lock(${lockKey}::bigint)`);

    const bookingCount = await tx.booking.count({
      where: {
        hub_id: parsed.hubId,
        date: parsed.date,
        status: "booked",
      },
    });

    if (bookingCount >= hub.daily_capacity) {
      throw Object.assign(
        new Error("This slot was taken. Please choose another."),
        { statusCode: 409 },
      );
    }

    // Cancel seller's previous live booking
    const existing = await tx.booking.findUnique({
      where: { submission_id: sub.id },
    });
    if (existing && existing.status === "booked") {
      await tx.booking.update({
        where: { id: existing.id },
        data: { status: "cancelled" },
      });
    }

    // Create new booking (upsert on submission_id unique)
    const booking = existing
      ? await tx.booking.update({
          where: { id: existing.id },
          data: {
            hub_id: parsed.hubId,
            date: parsed.date,
            slot: parsed.slot,
            status: "booked",
          },
        })
      : await tx.booking.create({
          data: {
            submission_id: sub.id,
            hub_id: parsed.hubId,
            seller_id: actor.id,
            date: parsed.date,
            slot: parsed.slot,
            status: "booked",
          },
        });

    await tx.submission.update({
      where: { id: sub.id },
      data: { status: "scheduled" },
    });

    await tx.activityLog.create({
      data: {
        actor_id: actor.id,
        actor_name: actor.fullName,
        text: `Inspection booked at ${hub.name} on ${parsed.date} at ${parsed.slot}`,
        entity: "submission",
        entity_id: sub.id,
        business_date: bDate,
      },
    });

    await tx.notification.create({
      data: {
        user_id: sub.seller_id,
        event: "inspection_booked",
        title: "Inspection booked",
        body: `${hub.name}, ${parsed.date} at ${parsed.slot}. Bring your device and ID.`,
        link: `/seller/deals/${sub.id}`,
        dedupe_key: `booked_${sub.id}_${parsed.date}`,
      },
    });

    return { ok: true, booking };
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function currentLiquidityScore(tx: PrismaTx, deviceModelId: string): Promise<number> {
  const score = await tx.liquidityScore.findFirst({
    where: { device_model_id: deviceModelId, is_current: true },
  });
  return score?.score ?? 0;
}

async function computeTotalExposure(tx: PrismaTx | PrismaClient): Promise<number> {
  const result = await tx.device.aggregate({
    where: {
      status: { notIn: ["settled", "liquidated", "returned"] },
    },
    _sum: { acquisition_cost: true },
  });
  return result._sum.acquisition_cost ?? 0;
}

async function computeModelExposure(tx: PrismaTx | PrismaClient, modelId: string): Promise<number> {
  const result = await tx.device.aggregate({
    where: {
      device_model_id: modelId,
      status: { notIn: ["settled", "liquidated", "returned"] },
    },
    _sum: { acquisition_cost: true },
  });
  return result._sum.acquisition_cost ?? 0;
}

function hashLockKey(hubId: string, date: string): number {
  let hash = 2001;
  const str = hubId + date;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

// ─── savePhotos (store photo metadata on submission) ────────────────────────

export async function savePhotos(
  actor: Actor,
  input: { submissionId: string; photos: Array<{ key: string; brightness: number; ok: boolean }>; retakeCount: number },
) {
  requireRole(actor, "customer");

  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({ where: { id: input.submissionId } });
    if (!sub) throw new Error("Submission not found.");
    requireOwner(actor, sub.seller_id);
    if (sub.status !== "draft") throw new Error("Submission is no longer a draft.");

    return tx.submission.update({
      where: { id: input.submissionId },
      data: {
        photos: input.photos as never,
        retake_count: input.retakeCount,
      },
    });
  });
}
