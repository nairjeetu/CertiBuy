"use client";

import { useHubJob } from "@/hooks/use-hub";
import { StatusChip } from "@/components/ui/StatusChip";
import { IdentityStep } from "./IdentityStep";
import { ChecklistStep } from "./ChecklistStep";
import { GradeStep } from "./GradeStep";
import { DecisionStep } from "./DecisionStep";
import { HandoverStep } from "./HandoverStep";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/format";

interface HubJobData {
  submissionId: string;
  status: string;
  statusLabel: string;
  chosenOption: string;
  today: string;
  model: { brand: string; name: string; storage: string; category: string };
  imei: string;
  booking: { hubName: string; date: string; slot: string; status: string } | null;
  aiAssessment: { band: string[]; confidence: string } | null;
  offer: {
    id: string;
    status: string;
    guaranteedPrice: number;
    instantCashAmount: number;
    icEligible: boolean;
    pricedBand: string[];
  } | null;
  report: {
    id: string;
    identityPassed: boolean;
    scannedImei: string | null;
    blacklistClear: boolean;
    activationLockOff: boolean;
    sealed: boolean;
    computedGrade: string | null;
    componentGrades: Record<string, string> | null;
    verdict: string | null;
    quotedAmount: number | null;
    revisedAmount: number | null;
    sellerDecision: string | null;
    batteryHealth: number;
    cosmeticGrade: string | null;
  } | null;
  device: { id: string; tagId: string; status: string; listingId: string | null } | null;
  nextStep: string;
}

const STEP_ORDER = ["identity", "checklist", "grade", "decision", "handover", "done"] as const;

export function HubJobClient({ submissionId }: { submissionId: string }) {
  const { data, isLoading, error } = useHubJob(submissionId);
  const router = useRouter();

  if (isLoading) return <p>Loading job...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const job = data as unknown as HubJobData;

  const stepIndex = STEP_ORDER.indexOf(job.nextStep as typeof STEP_ORDER[number]);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <button
        onClick={() => router.push("/hub")}
        style={{ fontSize: "0.8125rem", color: "#2563eb", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: "0.5rem" }}
      >
        &larr; Back to queue
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>
            {job.model.brand} {job.model.name} {job.model.storage}
          </h2>
          <p style={{ fontSize: "0.8125rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
            IMEI: {job.imei} · {job.chosenOption === "instant_cash" ? "Instant Cash" : "Sell For More"}
          </p>
          {job.offer && (
            <p style={{ fontSize: "0.8125rem", color: "#6b7280", margin: "0.125rem 0 0" }}>
              Offer: {formatINR(job.offer.guaranteedPrice)}
              {job.offer.icEligible && ` (IC: ${formatINR(job.offer.instantCashAmount)})`}
            </p>
          )}
        </div>
        <StatusChip label={job.statusLabel} tone={job.status === "accepted" ? "success" : job.status === "rejected" ? "destructive" : "neutral"} />
      </div>

      {job.booking && (
        <p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "1rem" }}>
          {job.booking.hubName} · {job.booking.date} · {job.booking.slot}
        </p>
      )}

      {job.aiAssessment && (
        <p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "1rem" }}>
          AI band: {(job.aiAssessment.band as string[]).join("–")} · confidence: {job.aiAssessment.confidence}
        </p>
      )}

      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem" }}>
        {STEP_ORDER.filter((s) => s !== "done").map((step, i) => (
          <div
            key={step}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: i < stepIndex || job.nextStep === "done"
                ? "#16a34a"
                : i === stepIndex
                ? "#2563eb"
                : "#e5e7eb",
            }}
          />
        ))}
      </div>

      {job.nextStep === "identity" && <IdentityStep submissionId={submissionId} imei={job.imei} report={job.report} />}
      {job.nextStep === "checklist" && <ChecklistStep submissionId={submissionId} />}
      {(job.nextStep === "decision" || job.nextStep === "mismatch") && (
        <GradeStep submissionId={submissionId} report={job.report} onContinue={() => null}>
          <DecisionStep submissionId={submissionId} report={job.report} />
        </GradeStep>
      )}
      {job.nextStep === "handover" && (
        <>
          {job.report?.sealed && <GradeStep submissionId={submissionId} report={job.report} onContinue={() => null} />}
          <HandoverStep submissionId={submissionId} />
        </>
      )}
      {job.nextStep === "done" && job.device && (
        <div style={{ padding: "1rem", border: "1px solid #dcfce7", borderRadius: "0.5rem", backgroundColor: "#f0fdf4" }}>
          <p style={{ fontWeight: 600, color: "#166534", margin: 0 }}>Handover complete</p>
          <p style={{ fontSize: "0.8125rem", color: "#374151", margin: "0.25rem 0 0" }}>
            Tag: {job.device.tagId} · Status: {job.device.status}
          </p>
        </div>
      )}
      {job.nextStep === "done" && !job.device && (job.status === "rejected" || job.status === "abandoned") && (
        <div style={{ padding: "1rem", border: "1px solid #fecaca", borderRadius: "0.5rem", backgroundColor: "#fef2f2" }}>
          <p style={{ fontWeight: 600, color: "#991b1b", margin: 0 }}>
            {job.status === "rejected" ? "Device rejected" : "Seller declined"}
          </p>
        </div>
      )}
    </div>
  );
}
