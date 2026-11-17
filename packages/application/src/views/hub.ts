import { prisma } from "@certibuy/db";
import { businessDate, addDays } from "@certibuy/domain";
import { submissionStatuses } from "@certibuy/contracts";
import type { Actor } from "../actor";
import { requireRole, requireHub } from "../policy";

type PrismaClient = typeof prisma;

async function readSettings(db: PrismaClient) {
  const s = await db.settings.findUnique({ where: { id: 1 } });
  if (!s) throw new Error("Settings are missing.");
  return s;
}

// ─── getHubQueue (T-01) ────────────────────────────────────────────────────

export async function getHubQueue(
  actor: Actor,
  params: Record<string, string>,
  now: Date,
) {
  requireRole(actor, "technician", "ops");
  const settings = await readSettings(prisma);
  const today = businessDate(settings, now);
  const date = params.date || today;

  const hubId = actor.hubId;
  const hubFilter = actor.role === "ops" ? {} : { hub_id: hubId! };

  const hub = hubId
    ? await prisma.hub.findUnique({ where: { id: hubId } })
    : null;

  const bookings = await prisma.booking.findMany({
    where: { ...hubFilter, date, status: "booked" },
    orderBy: { slot: "asc" },
    include: {
      submission: {
        include: {
          device_model: {
            select: { brand: true, model: true, storage: true, category: true },
          },
          grade_assessments: {
            orderBy: { created_at: "desc" },
            take: 1,
            select: { band: true, confidence: true },
          },
          inspection_report: {
            select: { identity_passed: true, sealed: true, computed_grade: true, verdict: true },
          },
        },
      },
      seller: { select: { full_name: true, phone: true } },
    },
  });

  const slots = new Map<string, typeof jobs>();
  type JobItem = {
    bookingId: string;
    submissionId: string;
    slot: string;
    status: string;
    statusLabel: string;
    seller: { name: string; phone: string };
    model: { brand: string; name: string; storage: string; category: string };
    aiBand: string[];
    confidence: string;
    inspectionStarted: boolean;
    identityPassed: boolean;
    gradeSealed: boolean;
    verdict: string | null;
    computedGrade: string | null;
  };
  const jobs: JobItem[] = [];

  for (const b of bookings) {
    const sub = b.submission;
    const ai = sub.grade_assessments[0];
    const report = sub.inspection_report;
    const subStatus = submissionStatuses[sub.status] ?? { label: sub.status, tone: "neutral" };

    const job: JobItem = {
      bookingId: b.id,
      submissionId: sub.id,
      slot: b.slot,
      status: sub.status,
      statusLabel: subStatus.label,
      seller: { name: b.seller.full_name, phone: b.seller.phone },
      model: {
        brand: sub.device_model.brand,
        name: sub.device_model.model,
        storage: sub.device_model.storage,
        category: sub.device_model.category,
      },
      aiBand: ai ? (ai.band as string[]) : [],
      confidence: ai ? String(ai.confidence) : "Low",
      inspectionStarted: !!report,
      identityPassed: report?.identity_passed ?? false,
      gradeSealed: report?.sealed ?? false,
      verdict: report?.verdict ?? null,
      computedGrade: report?.computed_grade ?? null,
    };
    jobs.push(job);

    const slotJobs = slots.get(b.slot) ?? [];
    slotJobs.push(job);
    slots.set(b.slot, slotJobs);
  }

  const days: string[] = [];
  for (let i = 0; i < 5; i++) {
    days.push(addDays(today, i));
  }

  return {
    hub: hub ? { id: hub.id, name: hub.name, city: hub.city } : null,
    today,
    date,
    days,
    jobs,
    slotGroups: Object.fromEntries(slots),
  };
}

// ─── getHubJob (T-02 … T-06) ──────────────────────────────────────────────

export async function getHubJob(
  actor: Actor,
  params: Record<string, string>,
  now: Date,
) {
  requireRole(actor, "technician", "ops");
  const submissionId = params.submissionId || params.jobId;
  if (!submissionId) throw new Error("submissionId is required.");

  const sub = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      device_model: true,
      booking: { include: { hub: { select: { id: true, name: true, city: true } } } },
      grade_assessments: { orderBy: { created_at: "desc" }, take: 1 },
      offers: { orderBy: { created_at: "desc" }, take: 1 },
      inspection_report: true,
      device: { include: { listing: true } },
    },
  });
  if (!sub) throw new Error("Submission not found.");
  if (sub.booking) {
    requireHub(actor, sub.booking.hub_id);
  }

  const settings = await readSettings(prisma);
  const today = businessDate(settings, now);
  const report = sub.inspection_report ?? null;
  const offer = sub.offers[0] ?? null;
  const aiAssessment = sub.grade_assessments[0] ?? null;
  const device = sub.device ?? null;

  let nextStep: string;
  if (sub.status === "rejected" || sub.status === "abandoned") {
    nextStep = "done";
  } else if (!report || !report.identity_passed) {
    nextStep = "identity";
  } else if (!report.sealed) {
    nextStep = "checklist";
  } else if (report.verdict === "inside" && sub.status === "inspected") {
    nextStep = "handover";
  } else if (report.verdict === "two_below") {
    nextStep = "mismatch";
  } else if (report.verdict === "one_below" && sub.status === "inspected") {
    nextStep = "decision";
  } else if (sub.status === "accepted" && !device) {
    nextStep = "handover";
  } else {
    nextStep = "done";
  }

  return {
    submissionId: sub.id,
    status: sub.status,
    statusLabel: (submissionStatuses[sub.status] ?? { label: sub.status }).label,
    chosenOption: sub.chosen_option,
    today,
    model: {
      brand: sub.device_model.brand,
      name: sub.device_model.model,
      storage: sub.device_model.storage,
      category: sub.device_model.category,
    },
    imei: sub.imei,
    booking: sub.booking ? {
      hubName: sub.booking.hub.name,
      date: sub.booking.date,
      slot: sub.booking.slot,
      status: sub.booking.status,
    } : null,
    aiAssessment: aiAssessment ? {
      band: aiAssessment.band,
      confidence: aiAssessment.confidence,
    } : null,
    offer: offer ? {
      id: offer.id,
      status: offer.status,
      guaranteedPrice: offer.guaranteed_price,
      instantCashAmount: offer.instant_cash_amount,
      icEligible: offer.ic_eligible,
      pricedBand: offer.priced_band,
    } : null,
    report: report ? {
      id: report.id,
      identityPassed: report.identity_passed,
      scannedImei: report.scanned_imei,
      blacklistClear: report.blacklist_clear,
      activationLockOff: report.activation_lock_off,
      sealed: report.sealed,
      computedGrade: report.computed_grade,
      componentGrades: report.component_grades,
      verdict: report.verdict,
      quotedAmount: report.quoted_amount,
      revisedAmount: report.revised_amount,
      sellerDecision: report.seller_decision,
      batteryHealth: report.battery_health,
      cosmeticGrade: report.cosmetic_grade,
    } : null,
    device: device ? {
      id: device.id,
      tagId: device.tag_id,
      status: device.status,
      listingId: device.listing?.id ?? null,
    } : null,
    nextStep,
  };
}
