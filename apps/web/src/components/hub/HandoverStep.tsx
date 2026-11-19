"use client";

import { useState } from "react";
import { useCompleteHandover } from "@/hooks/use-hub";
import { formatINR } from "@/lib/format";

interface Props {
  submissionId: string;
}

export function HandoverStep({ submissionId }: Props) {
  const [tagId, setTagId] = useState("");
  const [signatureUrl, setSignatureUrl] = useState("");
  const handover = useCompleteHandover();

  const tagValid = /^CB-\d{5}$/.test(tagId);

  const handleSubmit = () => {
    if (!tagValid || !signatureUrl.trim()) return;
    handover.mutate({ submissionId, sealed: true, tagId, signatureUrl: signatureUrl.trim() });
  };

  const result = handover.data as unknown as {
    ok: boolean;
    deviceId: string;
    paid: number;
    option: string;
    listingPrice: number;
    warrantyMonths: number;
  } | undefined;

  return (
    <div>
      <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Complete handover</h3>

      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.25rem" }}>
        Tag ID (CB-#####)
      </label>
      <input
        type="text"
        value={tagId}
        onChange={(e) => setTagId(e.target.value.toUpperCase())}
        placeholder="CB-00001"
        style={{ display: "block", width: "100%", padding: "0.5rem", border: `1px solid ${tagId && !tagValid ? "#dc2626" : "#d1d5db"}`, borderRadius: "0.375rem", marginBottom: "0.5rem", fontSize: "0.875rem" }}
      />

      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.25rem" }}>
        Signature URL
      </label>
      <input
        type="text"
        value={signatureUrl}
        onChange={(e) => setSignatureUrl(e.target.value)}
        placeholder="https://storage.example.com/sig/..."
        style={{ display: "block", width: "100%", padding: "0.5rem", border: "1px solid hsl(var(--border))", borderRadius: "0.375rem", marginBottom: "1rem", fontSize: "0.875rem" }}
      />

      <button
        onClick={handleSubmit}
        disabled={handover.isPending || !tagValid || !signatureUrl.trim()}
        style={{ padding: "0.5rem 1rem", backgroundColor: "#16a34a", color: "hsl(var(--primary-foreground))", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem" }}
      >
        {handover.isPending ? "Processing..." : "Confirm handover"}
      </button>

      {result && (
        <div style={{ marginTop: "1rem", padding: "0.75rem", borderRadius: "0.375rem", backgroundColor: "hsl(var(--success) / 0.05)", border: "1px solid #dcfce7" }}>
          <p style={{ fontWeight: 500, color: "hsl(var(--success))", margin: 0 }}>Handover complete</p>
          <p style={{ fontSize: "0.8125rem", color: "hsl(var(--foreground))", margin: "0.25rem 0 0" }}>
            Paid: {formatINR(result.paid)} ({result.option === "instant_cash" ? "Instant Cash" : "SFM advance"})
            {result.listingPrice > 0 && ` · Listed at ${formatINR(result.listingPrice)}`}
            {result.warrantyMonths > 0 && ` · ${result.warrantyMonths}mo warranty`}
          </p>
        </div>
      )}

      {handover.error && <p style={{ color: "hsl(var(--destructive))", fontSize: "0.8125rem", marginTop: "0.5rem" }}>{(handover.error as Error).message}</p>}
    </div>
  );
}
