"use client";

import { formatINR } from "@/lib/format";

interface Props {
  submissionId: string;
  report: {
    computedGrade: string | null;
    componentGrades: Record<string, string> | null;
    verdict: string | null;
    quotedAmount: number | null;
    revisedAmount: number | null;
  } | null;
  onContinue: () => void;
  children?: React.ReactNode;
}

const VERDICT_LABELS: Record<string, { label: string; tone: string }> = {
  inside: { label: "Within quoted band", tone: "success" },
  one_below: { label: "One grade below — revised offer", tone: "warning" },
  two_below: { label: "Two+ grades below — mismatch", tone: "destructive" },
};

export function GradeStep({ report, children }: Props) {
  if (!report || !report.computedGrade) return null;

  const v = VERDICT_LABELS[report.verdict ?? ""] ?? { label: report.verdict, tone: "neutral" };

  return (
    <div style={{ marginBottom: "1rem" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Grade result</h3>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.75rem" }}>
        <div style={{ width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "0.5rem", backgroundColor: "hsl(var(--secondary))", fontSize: "1.5rem", fontWeight: 700 }}>
          {report.computedGrade}
        </div>
        <div>
          <span
            style={{
              display: "inline-block",
              padding: "0.125rem 0.5rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 500,
              backgroundColor: v.tone === "success" ? "#dcfce7" : v.tone === "warning" ? "#fef9c3" : "#fecaca",
              color: v.tone === "success" ? "hsl(var(--success))" : v.tone === "warning" ? "hsl(var(--warning))" : "#991b1b",
            }}
          >
            {v.label}
          </span>
        </div>
      </div>

      {report.componentGrades && (
        <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8125rem", marginBottom: "0.75rem" }}>
          {Object.entries(report.componentGrades).map(([k, g]) => (
            <span key={k} style={{ color: "hsl(var(--foreground))" }}>
              {k}: <strong>{g as string}</strong>
            </span>
          ))}
        </div>
      )}

      {(report.quotedAmount != null || report.revisedAmount != null) && (
        <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.8125rem", marginBottom: "0.75rem" }}>
          {report.quotedAmount != null && <span>Quoted: {formatINR(report.quotedAmount)}</span>}
          {report.revisedAmount != null && <span>Revised: <strong>{formatINR(report.revisedAmount)}</strong></span>}
        </div>
      )}

      {children}
    </div>
  );
}
