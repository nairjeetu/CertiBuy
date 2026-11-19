"use client";

import { useGradeSubmission, useSubmissionWizard } from "@/hooks/use-seller";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StepRail } from "./StepRail";

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
      <div className="grade-page">
        <StepRail current={4} />
        <div className="grade-loading surface">
          <div className="spinner" />
          <p>Grading your device...</p>
          <p className="meta">Running the grading engine. This takes a moment.</p>
        </div>
        <style jsx>{`
          .grade-page { max-width: 560px; margin: 0 auto; padding: 1.5rem 1rem 3rem; }
          .grade-loading { text-align: center; padding: 3rem 1rem; }
          .grade-loading p { margin: 0.5rem 0 0; }
          .spinner {
            width: 32px; height: 32px;
            border: 3px solid hsl(var(--border));
            border-top-color: hsl(var(--primary));
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 1rem;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (grade.isError) {
    return (
      <div className="grade-page">
        <StepRail current={4} />
        <div className="error-card surface">
          <p style={{ color: "hsl(var(--destructive))", margin: 0 }}>{(grade.error as Error).message}</p>
          <button onClick={() => router.back()} className="btn-secondary" style={{ marginTop: "1rem" }}>← Go back</button>
        </div>
        <style jsx>{`
          .grade-page { max-width: 560px; margin: 0 auto; padding: 1.5rem 1rem 3rem; }
          .error-card { padding: 1.5rem; }
          .btn-secondary {
            padding: 0.625rem 1.25rem; background: hsl(var(--card)); color: hsl(var(--foreground));
            border: 1px solid hsl(var(--border)); border-radius: 9999px; font-size: 0.875rem; cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  if (result?.rejected) {
    return (
      <div className="grade-page">
        <StepRail current={4} />
        <div className="reject-card surface">
          <div className="reject-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--destructive))" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
          <h2 className="reject-title">Device not eligible</h2>
          <p className="reject-reason">{result.reason}</p>
        </div>
        <button onClick={() => router.push("/seller")} className="btn-secondary" style={{ marginTop: "1rem" }}>Back to seller home</button>
        <style jsx>{`
          .grade-page { max-width: 560px; margin: 0 auto; padding: 1.5rem 1rem 3rem; }
          .reject-card {
            padding: 2rem; text-align: center;
            border: 1px solid hsl(var(--destructive) / 0.2);
            background: hsl(var(--destructive) / 0.03);
          }
          .reject-icon { margin-bottom: 0.75rem; }
          .reject-title { font-size: 1.125rem; font-weight: 600; color: hsl(var(--destructive)); margin: 0 0 0.5rem; }
          .reject-reason { font-size: 0.875rem; color: hsl(var(--muted)); margin: 0; }
          .btn-secondary {
            padding: 0.625rem 1.25rem; background: hsl(var(--card)); color: hsl(var(--foreground));
            border: 1px solid hsl(var(--border)); border-radius: 9999px; font-size: 0.875rem; cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  if (result?.ok && result.assessment) {
    const a = result.assessment;
    return (
      <div className="grade-page">
        <StepRail current={4} />
        <div className="result-card surface">
          <div className="result-header">
            <span className="result-grade-letter">{a.estimate}</span>
            <div>
              <h2 className="result-heading">Estimated grade: {a.estimate}</h2>
              <p className="meta" style={{ margin: 0 }}>Band: {a.band.join(" – ")} · Confidence: {a.confidence}</p>
            </div>
          </div>
          <ul className="result-factors">
            {a.factors.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
        <button
          onClick={() => router.push(`/seller/sell/${submissionId}/offer`)}
          className="btn-primary"
          style={{ marginTop: "1rem" }}
        >
          See your offer →
        </button>
        <style jsx>{`
          .grade-page { max-width: 560px; margin: 0 auto; padding: 1.5rem 1rem 3rem; }
          .result-card {
            padding: 1.5rem;
            border: 1px solid hsl(var(--success) / 0.3);
            background: hsl(var(--success) / 0.03);
          }
          .result-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
          .result-grade-letter {
            font-family: var(--font-display); font-style: italic; font-size: 2.5rem;
            color: hsl(var(--success)); line-height: 1;
          }
          .result-heading { font-size: 1.0625rem; font-weight: 600; margin: 0 0 0.25rem; color: hsl(var(--foreground)); }
          .result-factors {
            margin: 0; padding-left: 1.25rem;
            font-size: 0.8125rem; color: hsl(var(--foreground));
            line-height: 1.6;
          }
          .btn-primary {
            padding: 0.625rem 1.5rem; background: hsl(var(--primary)); color: hsl(var(--primary-foreground));
            border: none; border-radius: 9999px; font-weight: 600; font-size: 0.875rem; cursor: pointer;
          }
          .btn-primary:hover { opacity: 0.9; }
        `}</style>
      </div>
    );
  }

  return null;
}
