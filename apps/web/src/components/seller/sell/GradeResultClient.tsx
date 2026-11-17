"use client";

import { useGradeSubmission, useSubmissionWizard } from "@/hooks/use-seller";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface GradeResponse {
  ok: boolean;
  rejected?: boolean;
  code?: string;
  reason?: string;
  assessment?: {
    estimate: string;
    band: string[];
    confidence: string;
    factors: string[];
  };
}

export function GradeResultClient({ submissionId }: { submissionId: string }) {
  const grade = useGradeSubmission();
  const { data: wizard } = useSubmissionWizard(submissionId);
  const router = useRouter();
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [triggered, setTriggered] = useState(false);

  const status = (wizard as { status?: string })?.status;

  useEffect(() => {
    if (triggered) return;
    if (status === "graded" || status === "offer_accepted" || status === "scheduled") {
      router.push(`/seller/sell/${submissionId}/offer`);
      return;
    }
    if (status === "rejected") return;
    if (status !== "draft") return;

    setTriggered(true);
    grade.mutate({ submissionId }, {
      onSuccess: (data) => setResult(data as unknown as GradeResponse),
    });
  }, [status, triggered, submissionId, grade, router]);

  if (grade.isPending) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center", padding: "3rem 1rem" }}>
        <p style={{ fontSize: "1rem" }}>Grading your device...</p>
      </div>
    );
  }

  if (grade.isError) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <p style={{ color: "#991b1b" }}>{(grade.error as Error).message}</p>
        <button onClick={() => router.back()} style={{ marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}>
          Go back
        </button>
      </div>
    );
  }

  if (result?.rejected) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ padding: "1.5rem", border: "1px solid #fecaca", borderRadius: "0.5rem", backgroundColor: "#fef2f2" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#991b1b", marginBottom: "0.5rem" }}>
            Device not eligible
          </h2>
          <p style={{ fontSize: "0.875rem", color: "#7f1d1d" }}>{result.reason}</p>
        </div>
        <button onClick={() => router.push("/seller")} style={{ marginTop: "1.5rem", padding: "0.5rem 1rem", cursor: "pointer", border: "1px solid #d1d5db", borderRadius: "0.375rem", backgroundColor: "#fff" }}>
          Back to seller home
        </button>
      </div>
    );
  }

  if (result?.ok && result.assessment) {
    const a = result.assessment;
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ padding: "1.5rem", border: "1px solid #bbf7d0", borderRadius: "0.5rem", backgroundColor: "#f0fdf4" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.75rem" }}>
            Estimated grade: {a.estimate}
          </h2>
          <div style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>
            <strong>Band:</strong> {a.band.join(" – ")} · <strong>Confidence:</strong> {a.confidence}
          </div>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.8125rem", color: "#374151" }}>
            {a.factors.map((f, i) => <li key={i} style={{ marginBottom: "0.25rem" }}>{f}</li>)}
          </ul>
        </div>
        <button
          onClick={() => router.push(`/seller/sell/${submissionId}/offer`)}
          style={{ marginTop: "1.5rem", padding: "0.5rem 1.25rem", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}
        >
          See your offer
        </button>
      </div>
    );
  }

  return null;
}
