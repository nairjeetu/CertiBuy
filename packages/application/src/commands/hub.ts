import { prisma } from "@certibuy/db";
import {
  VerifyIdentityInput,
  ConfirmGradeInput,
  ReviseOfferInput,
  AcceptRevisedInput,
  DeclineRevisedInput,
  RejectForMismatchInput,
  RejectDeviceInput,
  CompleteHandoverInput,
} from "@certibuy/contracts";
import type { z } from "zod";
import {
  confirmGrade as confirmGradeDomain,
  gradePrice,
  computeOffer as computeOfferDomain,
  riskPct,
  icEligibility as icEligibilityDomain,
  businessDate,
  formatINR,
  payoutPlan,
} from "@certibuy/domain";
import type { Actor } from "../actor";
import { requireRole, requireHub } from "../policy";
import { toDate } from "../util";

type PrismaClient = typeof prisma;
type PrismaTx = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

async function readSettings(tx: PrismaTx) {
  const s = await tx.settings.findUnique({ where: { id: 1 } });
  if (!s) throw new Error("Settings are missing.");
  return s;
}

// ─── T-02: verifyIdentity ──────────────────────────────────────────────────

export async function verifyIdentity(
  actor: Actor,
  input: z.infer<typeof VerifyIdentityInput>,
) {
  requireRole(actor, "technician", "ops");
  const parsed = VerifyIdentityInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({
      where: { id: parsed.submissionId },
      include: { booking: true },
    });
    if (!sub) throw new Error("Submission not found.");
    if (!sub.booking) throw new Error("No booking for this submission.");
    requireHub(actor, sub.booking.hub_id);

    const imeiMatch =
      sub.imei.slice(-8) === parsed.scannedImei.slice(-8);

    const blacklisted = await tx.blacklistedImei.findUnique({
      where: { imei: parsed.scannedImei },
    });

    const passed = imeiMatch && !blacklisted && parsed.activationLockOff;

    const report = await tx.inspectionReport.upsert({
      where: { submission_id: sub.id },
      create: {
        type: "intake",
        submission_id: sub.id,
        hub_id: sub.booking.hub_id,
        technician_id: actor.id,
        checklist: {},
        battery_health: 0,
        cosmetic_grade: "A",
        computed_grade: "A",
        component_grades: {},
        ai_band: [],
        verdict: "inside",
        scanned_imei: parsed.scannedImei,
        blacklist_clear: !blacklisted,
        activation_lock_off: parsed.activationLockOff,
        identity_passed: passed,
      },
      update: {
        scanned_imei: parsed.scannedImei,
        blacklist_clear: !blacklisted,
        activation_lock_off: parsed.activationLockOff,
        identity_passed: passed,
      },
    });

    return {
      ok: true,
      reportId: report.id,
      passed,
      imeiMatch,
      blacklisted: !!blacklisted,
      activationLockOff: parsed.activationLockOff,
    };
  });
}

// ─── T-03/T-04: confirmGrade ───────────────────────────────────────────────

export async function confirmGrade(
  actor: Actor,
  input: z.infer<typeof ConfirmGradeInput>,
  now: Date,
) {
  requireRole(actor, "technician", "ops");
  const parsed = ConfirmGradeInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({
      where: { id: parsed.submissionId },
      include: {
        booking: true,
        device_model: true,
        grade_assessments: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
        offers: {
          where: { status: "active" },
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });
    if (!sub) throw new Error("Submission not found.");
    if (!sub.booking) throw new Error("No booking for this submission.");
    requireHub(actor, sub.booking.hub_id);

    const report = await tx.inspectionReport.findUnique({
      where: { submission_id: sub.id },
    });
    if (!report) throw new Error("Identity check not done yet.");
    if (!report.identity_passed) throw new Error("Identity check did not pass.");

    const settings = await readSettings(tx);

    const aiAssessment = sub.grade_assessments[0];
    const aiBand: Array<"A" | "B" | "C" | "D"> = aiAssessment
      ? (aiAssessment.band as Array<"A" | "B" | "C" | "D">)
      : ["A", "B", "C", "D"];

    const checklist = parsed.checklist as Record<string, "pass" | "fail">;
    const result = confirmGradeDomain(
      { checklist, battery_health: parsed.batteryHealth, cosmetic_grade: parsed.cosmeticGrade },
      aiBand,
      settings,
    );

    const activeOffer = sub.offers[0];
    const quotedAmount = activeOffer?.guaranteed_price ?? 0;

    const revisedMarket = gradePrice(sub.device_model, result.final_grade, settings);
    const revisedOffer = computeOfferDomain(revisedMarket, 0, settings);
    const revisedAmount = revisedOffer.guaranteed;

    await tx.inspectionReport.update({
      where: { id: report.id },
      data: {
        checklist: JSON.parse(JSON.stringify(parsed.checklist)),
        battery_health: parsed.batteryHealth,
        cosmetic_grade: parsed.cosmeticGrade,
        photos: JSON.parse(JSON.stringify(parsed.photos)),
        computed_grade: result.final_grade,
        component_grades: JSON.parse(JSON.stringify(result.component_grades)),
        ai_band: aiBand,
        verdict: result.verdict,
        quoted_amount: quotedAmount,
        revised_amount: revisedAmount,
        sealed: true,
        sealed_at: now,
      },
    });

    const newStatus = result.verdict === "inside" ? "accepted" : "inspected";
    await tx.submission.update({
      where: { id: sub.id },
      data: {
        status: newStatus,
        ...(result.verdict === "inside" ? { final_grade: result.final_grade } : {}),
      },
    });

    const worstKey =
      result.component_grades.battery === result.final_grade ? "battery" :
      result.component_grades.cosmetic === result.final_grade ? "cosmetic" : "functions";

    return {
      ok: true,
      reportId: report.id,
      finalGrade: result.final_grade,
      componentGrades: result.component_grades,
      worstKey,
      band: aiBand,
      verdict: result.verdict,
      quoted: quotedAmount,
      revised: revisedAmount,
    };
  });
}

// ─── T-05: reviseOffer ─────────────────────────────────────────────────────

export async function reviseOffer(
  actor: Actor,
  input: z.infer<typeof ReviseOfferInput>,
  now: Date,
) {
  requireRole(actor, "technician", "ops");
  const parsed = ReviseOfferInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({
      where: { id: parsed.submissionId },
      include: {
        device_model: true,
        offers: {
          where: { status: { in: ["active", "accepted"] } },
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });
    if (!sub) throw new Error("Submission not found.");

    const report = await tx.inspectionReport.findUnique({
      where: { submission_id: sub.id },
    });
    if (!report || !report.sealed) throw new Error("Grade not confirmed yet.");

    const settings = await readSettings(tx);
    const bDate = businessDate(settings, now);
    const finalGrade = report.computed_grade;
    const marketPrice = gradePrice(sub.device_model, finalGrade, settings);

    const existingOffer = sub.offers[0];
    if (existingOffer) {
      const existingBand = existingOffer.priced_band as string[];
      if (existingBand.length === 1 && existingBand[0] === finalGrade) {
        return {
          ok: true,
          reused: true,
          offerId: existingOffer.id,
          quoted: report.quoted_amount,
          revised: existingOffer.guaranteed_price,
          option: sub.chosen_option,
          finalGrade,
          icEligible: existingOffer.ic_eligible,
          icReason: existingOffer.ic_reason,
        };
      }
    }

    const liqScore = await tx.liquidityScore.findFirst({
      where: { device_model_id: sub.device_model_id, is_current: true },
    });
    const score = liqScore?.score ?? 50;
    const risk = riskPct(score, settings);
    const offer = computeOfferDomain(marketPrice, risk, settings);

    const totalExposure = await computeTotalExposure(tx);
    const modelExposure = await computeModelExposure(tx, sub.device_model_id);

    const icResult = icEligibilityDomain({
      ic_paused: false,
      score,
      confidence: "High",
      launch_window: false,
      total_exposure: totalExposure,
      model_exposure: modelExposure,
      settings,
    });

    const expiresAt = toDate(
      (await import("@certibuy/domain")).addDays(bDate, settings.offer_expiry_days) + "T23:59:59.999Z",
    );

    const offerRow = await tx.offer.create({
      data: {
        submission_id: sub.id,
        seller_id: sub.seller_id,
        version: (existingOffer?.version ?? 0) + 1,
        priced_band: [finalGrade],
        instant_cash_amount: offer.instantCash,
        guaranteed_price: offer.guaranteed,
        ic_eligible: icResult.eligible,
        ic_reason: icResult.reason,
        risk_pct: risk,
        risk_tier: score >= settings.liquidity_threshold ? "low" : "medium",
        breakdown: offer.breakdown as never,
        settings_version: settings.version,
        expires_at: expiresAt,
        status: "active",
      },
    });

    if (existingOffer) {
      await tx.offer.update({
        where: { id: existingOffer.id },
        data: { status: "declined" },
      });
    }

    await tx.inspectionReport.update({
      where: { id: report.id },
      data: {
        quoted_amount: report.quoted_amount,
        revised_amount: offer.guaranteed,
      },
    });

    await tx.submission.update({
      where: { id: sub.id },
      data: { current_offer_id: offerRow.id, status: "revised_offer" },
    });

    await tx.notification.create({
      data: {
        user_id: sub.seller_id,
        event: "revised_offer",
        title: "Revised offer for your device",
        body: `Your device was graded ${finalGrade}. A revised offer of ${formatINR(offer.guaranteed)} has been made. Please accept or decline.`,
        link: `/seller/deals/${sub.id}`,
      },
    });

    return {
      ok: true,
      reused: false,
      offerId: offerRow.id,
      quoted: report.quoted_amount,
      revised: offer.guaranteed,
      option: sub.chosen_option,
      finalGrade,
      icEligible: icResult.eligible,
      icReason: icResult.reason,
    };
  });
}

// ─── S-14 / T-05: acceptRevised ────────────────────────────────────────────

export async function acceptRevised(
  actor: Actor,
  input: z.infer<typeof AcceptRevisedInput>,
) {
  requireRole(actor, "customer", "ops");
  const parsed = AcceptRevisedInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({
      where: { id: parsed.submissionId },
      include: {
        offers: { where: { status: "active" }, orderBy: { created_at: "desc" }, take: 1 },
        booking: true,
      },
    });
    if (!sub) throw new Error("Submission not found.");

    const offer = sub.offers[0];
    if (!offer) throw new Error("No active offer to accept.");

    await tx.offer.update({ where: { id: offer.id }, data: { status: "accepted" } });
    await tx.submission.update({
      where: { id: sub.id },
      data: { status: "accepted", current_offer_id: offer.id },
    });

    const report = await tx.inspectionReport.findUnique({
      where: { submission_id: sub.id },
    });
    if (report) {
      await tx.inspectionReport.update({
        where: { id: report.id },
        data: { seller_decision: "accepted" },
      });
    }

    if (sub.booking) {
      await tx.booking.update({
        where: { id: sub.booking.id },
        data: { status: "completed" },
      });
    }

    return { ok: true, amount: offer.guaranteed_price };
  });
}

// ─── S-14 / T-05: declineRevised ──────────────────────────────────────────

export async function declineRevised(
  actor: Actor,
  input: z.infer<typeof DeclineRevisedInput>,
) {
  requireRole(actor, "customer", "ops");
  const parsed = DeclineRevisedInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({
      where: { id: parsed.submissionId },
      include: {
        offers: { where: { status: "active" }, orderBy: { created_at: "desc" }, take: 1 },
        booking: true,
      },
    });
    if (!sub) throw new Error("Submission not found.");
    if (sub.status === "abandoned") return { ok: true, already: true };

    const offer = sub.offers[0];
    if (offer) {
      await tx.offer.update({ where: { id: offer.id }, data: { status: "declined" } });
    }

    await tx.submission.update({ where: { id: sub.id }, data: { status: "abandoned" } });

    const report = await tx.inspectionReport.findUnique({
      where: { submission_id: sub.id },
    });
    if (report) {
      await tx.inspectionReport.update({
        where: { id: report.id },
        data: { seller_decision: "declined" },
      });
    }

    if (sub.booking) {
      await tx.booking.update({
        where: { id: sub.booking.id },
        data: { status: "cancelled" },
      });
    }

    return { ok: true, already: false };
  });
}

// ─── T-05: rejectForMismatch ───────────────────────────────────────────────

export async function rejectForMismatch(
  actor: Actor,
  input: z.infer<typeof RejectForMismatchInput>,
  now: Date,
) {
  requireRole(actor, "technician", "ops");
  const parsed = RejectForMismatchInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({
      where: { id: parsed.submissionId },
      include: {
        offers: { where: { status: "active" }, orderBy: { created_at: "desc" }, take: 1 },
        booking: true,
      },
    });
    if (!sub) throw new Error("Submission not found.");

    const settings = await readSettings(tx);
    const bDate = businessDate(settings, now);

    const offer = sub.offers[0];
    if (offer) {
      await tx.offer.update({ where: { id: offer.id }, data: { status: "declined" } });
    }

    await tx.submission.update({ where: { id: sub.id }, data: { status: "rejected" } });

    const report = await tx.inspectionReport.findUnique({
      where: { submission_id: sub.id },
    });
    if (report) {
      await tx.inspectionReport.update({
        where: { id: report.id },
        data: { seller_decision: parsed.feePaid ? "fee_paid" : "fee_due" },
      });
    }

    if (sub.booking) {
      await tx.booking.update({
        where: { id: sub.booking.id },
        data: { status: "completed" },
      });
    }

    if (parsed.feePaid) {
      await tx.payout.create({
        data: {
          seller_id: sub.seller_id,
          submission_id: sub.id,
          device_id: null,
          type: "mismatch_fee",
          amount: settings.mismatch_fee,
          trigger: "inspection_mismatch",
          status: "pending",
        },
      });
    }

    await tx.exceptionCase.create({
      data: {
        type: "grade_dispute",
        title: `Grade mismatch on submission ${sub.id.slice(0, 8)}`,
        related_entity: "submission",
        related_id: sub.id,
      },
    });

    await tx.activityLog.create({
      data: {
        actor_id: actor.id,
        actor_name: actor.fullName,
        text: `Rejected for grade mismatch (fee ${parsed.feePaid ? "paid" : "due"})`,
        entity: "submission",
        entity_id: sub.id,
        business_date: bDate,
      },
    });

    return {
      ok: true,
      fee: settings.mismatch_fee,
      feeStatus: parsed.feePaid ? "paid" : "pending",
    };
  });
}

// ─── T-07: rejectDevice ────────────────────────────────────────────────────

export async function rejectDevice(
  actor: Actor,
  input: z.infer<typeof RejectDeviceInput>,
  now: Date,
) {
  requireRole(actor, "technician", "ops");
  const parsed = RejectDeviceInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({
      where: { id: parsed.submissionId },
      include: { booking: true },
    });
    if (!sub) throw new Error("Submission not found.");
    if (!sub.booking) throw new Error("No booking for this submission.");
    requireHub(actor, sub.booking.hub_id);

    const settings = await readSettings(tx);
    const bDate = businessDate(settings, now);

    await tx.submission.update({ where: { id: sub.id }, data: { status: "rejected" } });
    await tx.booking.update({
      where: { id: sub.booking.id },
      data: { status: "completed" },
    });

    if (parsed.reasonCode === "imei_mismatch") {
      await tx.exceptionCase.create({
        data: {
          type: "failed_inspection",
          title: `IMEI mismatch on submission ${sub.id.slice(0, 8)}`,
          detail: parsed.note ?? "",
          related_entity: "submission",
          related_id: sub.id,
        },
      });
    }

    await tx.activityLog.create({
      data: {
        actor_id: actor.id,
        actor_name: actor.fullName,
        text: `Rejected device: ${parsed.reasonCode}${parsed.note ? ` — ${parsed.note}` : ""}`,
        entity: "submission",
        entity_id: sub.id,
        business_date: bDate,
      },
    });

    await tx.notification.create({
      data: {
        user_id: sub.seller_id,
        event: "device_rejected",
        title: "Device rejected",
        body: `Your device was rejected at the hub: ${parsed.reasonCode}.`,
        link: `/seller/deals/${sub.id}`,
      },
    });

    return { ok: true };
  });
}

// ─── T-06: completeHandover ────────────────────────────────────────────────

export async function completeHandover(
  actor: Actor,
  input: z.infer<typeof CompleteHandoverInput>,
  now: Date,
) {
  requireRole(actor, "technician", "ops");
  const parsed = CompleteHandoverInput.parse(input);

  return prisma.$transaction(async (tx) => {
    const sub = await tx.submission.findUnique({
      where: { id: parsed.submissionId },
      include: {
        booking: true,
        device_model: true,
        offers: {
          where: { status: "accepted" },
          orderBy: { created_at: "desc" },
          take: 1,
        },
      },
    });
    if (!sub) throw new Error("Submission not found.");
    if (sub.status !== "accepted") throw new Error("Submission must be in accepted status.");
    if (!sub.booking) throw new Error("No booking for this submission.");
    requireHub(actor, sub.booking.hub_id);

    const report = await tx.inspectionReport.findUnique({
      where: { submission_id: sub.id },
    });
    if (!report || !report.sealed) throw new Error("Inspection report not sealed.");

    const existingDevice = await tx.device.findUnique({
      where: { submission_id: sub.id },
    });
    if (existingDevice) throw new Error("Device already created for this submission.");

    const offer = sub.offers[0];
    if (!offer) throw new Error("No accepted offer found.");

    const settings = await readSettings(tx);
    const bDate = businessDate(settings, now);
    const finalGrade = report.computed_grade;
    const isGradeD = finalGrade === "D";

    const acquisitionCost = offer.guaranteed_price;
    const payoutOption = sub.chosen_option as "instant_cash" | "sell_for_more";

    const device = await tx.device.create({
      data: {
        submission_id: sub.id,
        seller_id: sub.seller_id,
        device_model_id: sub.device_model_id,
        colour: sub.colour ?? "",
        imei: sub.imei,
        tag_id: parsed.tagId,
        final_grade: finalGrade,
        payout_option: payoutOption,
        acquisition_cost: acquisitionCost,
        owner: "certibuy",
        custody_at: sub.booking.hub_id,
        hub_id: sub.booking.hub_id,
        status: isGradeD ? "in_refurbishment" : "listed",
      },
    });

    const plan = payoutPlan(payoutOption, acquisitionCost, settings);

    const payoutType = payoutOption === "instant_cash" ? "instant_cash_full" : "advance";
    const firstPayout = await tx.payout.create({
      data: {
        seller_id: sub.seller_id,
        submission_id: sub.id,
        device_id: device.id,
        type: payoutType,
        amount: plan.advance,
        trigger: "custody_handover",
        status: "pending",
      },
    });

    if (payoutOption === "sell_for_more" && plan.balance > 0) {
      await tx.payout.create({
        data: {
          seller_id: sub.seller_id,
          submission_id: sub.id,
          device_id: device.id,
          type: "balance",
          amount: plan.balance,
          trigger: plan.balance_trigger,
          status: "due",
        },
      });
    }

    let listingId: string | null = null;
    let listingPrice = 0;
    let warrantyMonths = 0;

    if (!isGradeD) {
      const marketPrice = gradePrice(sub.device_model, finalGrade, settings);
      warrantyMonths = settings.warranty_months;
      listingPrice = marketPrice;

      const listing = await tx.listing.create({
        data: {
          device_id: device.id,
          base_price: marketPrice,
          current_price: marketPrice,
          floor_price: sub.device_model.b2b_floor_price,
          listed_at: bDate,
          warranty_months: warrantyMonths,
          status: "active",
        },
      });
      listingId = listing.id;
    }

    await tx.inspectionReport.update({
      where: { id: report.id },
      data: { tag_id: parsed.tagId, signature_url: parsed.signatureUrl },
    });

    await tx.booking.update({
      where: { id: sub.booking.id },
      data: { status: "completed" },
    });

    await tx.activityLog.create({
      data: {
        actor_id: actor.id,
        actor_name: actor.fullName,
        text: `Handover completed: ${parsed.tagId}, grade ${finalGrade}, ${payoutOption}`,
        entity: "device",
        entity_id: device.id,
        business_date: bDate,
      },
    });

    await tx.notification.create({
      data: {
        user_id: sub.seller_id,
        event: "handover_complete",
        title: "Device handed over",
        body: `Your device (${parsed.tagId}) has been received. Payment is being processed.`,
        link: `/seller/deals/${sub.id}`,
      },
    });

    return {
      ok: true,
      deviceId: device.id,
      listingId,
      payoutId: firstPayout.id,
      paid: plan.advance,
      option: payoutOption,
      listingPrice,
      warrantyMonths,
    };
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────

async function computeTotalExposure(tx: PrismaTx): Promise<number> {
  const result = await tx.device.aggregate({
    where: {
      owner: "certibuy",
      status: { notIn: ["settled", "liquidated", "returned"] },
    },
    _sum: { acquisition_cost: true },
  });
  return result._sum.acquisition_cost ?? 0;
}

async function computeModelExposure(tx: PrismaTx, modelId: string): Promise<number> {
  const result = await tx.device.aggregate({
    where: {
      device_model_id: modelId,
      owner: "certibuy",
      status: { notIn: ["settled", "liquidated", "returned"] },
    },
    _sum: { acquisition_cost: true },
  });
  return result._sum.acquisition_cost ?? 0;
}
