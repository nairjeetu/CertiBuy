"use client";

import { useReviseOffer, useRejectForMismatch } from "@/hooks/use-hub";
import { formatINR } from "@/lib/format";
import { useState, useEffect } from "react";

interface Props {
  submissionId: string;
  report: {
    verdict: string | null;
    quotedAmount: number | null;
    revisedAmount: number | null;
    sellerDecision: string | null;
  } | null;
}

export function DecisionStep({ submissionId, report }: Props) {
  const revise = useReviseOffer();
  const mismatch = useRejectForMismatch();
  const [feePaid, setFeePaid] = useState(false);

  const isMismatch = report?.verdict === "two_below";
  const isOneBelow = report?.verdict === "one_below";

  const reviseResult = revise.data as unknown as { ok: boolean; revised: number; icEligible: boolean } | undefined;

  useEffect(() => {
    if (isOneBelow && !reviseResult && !revise.isPending) {
      revise.mutate({ submissionId });
    }
  }, [isOneBelow, reviseResult, revise, submissionId]);

  if (isMismatch) {
    return (
      <div style={{ marginTop: "0.75rem" }}>
        <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>Grade mismatch</h4>
        <p style={{ fontSize: "0.8125rem", color: "hsl(var(--muted))", marginBottom: "0.75rem" }}>
          The device is two or more grades below the quoted band. A mismatch fee applies.
        </p>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", marginBottom: "0.75rem", cursor: "pointer" }}>
          <input type="checkbox" checked={feePaid} onChange={(e) => setFeePaid(e.target.checked)} />
          Mismatch fee collected
        </label>
        <button
          onClick={() => mismatch.mutate({ submissionId, feePaid })}
          disabled={mismatch.isPending}
          style={{ padding: "0.5rem 1rem", backgroundColor: "#dc2626", color: "hsl(var(--primary-foreground))", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem" }}
        >
          {mismatch.isPending ? "Processing..." : "Reject for mismatch"}
        </button>
        {mismatch.error && <p style={{ color: "hsl(var(--destructive))", fontSize: "0.8125rem", marginTop: "0.5rem" }}>{(mismatch.error as Error).message}</p>}
      </div>
    );
  }

  return (
    <div style={{ marginTop: "0.75rem" }}>
      <h4 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>Revised offer</h4>
      {revise.isPending && <p style={{ fontSize: "0.8125rem", color: "hsl(var(--muted))" }}>Computing revised offer...</p>}
      {reviseResult && (
        <p style={{ fontSize: "0.8125rem", color: "hsl(var(--foreground))", marginBottom: "0.75rem" }}>
          New offer: <strong>{formatINR(reviseResult.revised)}</strong>
          {reviseResult.icEligible && " (IC eligible)"}
        </p>
      )}
      <div style={{ padding: "0.75rem 1rem", background: "hsl(var(--warning) / 0.1)", borderRadius: "0.5rem", border: "1px solid hsl(var(--warning) / 0.3)" }}>
        <p style={{ fontSize: "0.8125rem", color: "hsl(var(--foreground))", margin: 0, fontWeight: 500 }}>
          Revised offer sent to seller. Waiting for seller to accept or decline.
        </p>
        <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted))", margin: "0.25rem 0 0" }}>
          The seller will see this offer on their deal tracker and in their notifications.
        </p>
      </div>
      {revise.error && <p style={{ color: "hsl(var(--destructive))", fontSize: "0.8125rem", marginTop: "0.5rem" }}>{(revise.error as Error).message}</p>}
    </div>
  );
}
