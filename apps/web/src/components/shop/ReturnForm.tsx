"use client";

import { useState } from "react";
import { useRaiseReturn } from "@/hooks/use-shop";
import { formatINR } from "@/lib/format";

interface ReasonOption {
  value: string;
  label: string;
  estimated: { original: number; deduction: number; refund: number; deduction_label: string };
}

interface Props {
  orderId: string;
  reasons: ReasonOption[];
  onDone: () => void;
}

export function ReturnForm({ orderId, reasons, onDone }: Props) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [doaPref, setDoaPref] = useState<"refund" | "replacement">("refund");
  const raiseReturn = useRaiseReturn();

  const selected = reasons.find((r) => r.value === reason);
  const isDoa = reason === "dead_on_arrival";

  return (
    <div style={{ maxWidth: 480 }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 1rem" }}>Raise a return</h3>

      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
        Reason
      </label>
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        style={{ width: "100%", padding: "0.5rem", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: "0.875rem", marginBottom: "0.75rem" }}
      >
        <option value="">Select a reason</option>
        {reasons.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>

      {selected && (
        <div style={{ padding: "0.75rem", backgroundColor: "hsl(var(--secondary))", borderRadius: "0.75rem", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
          <p style={{ margin: 0 }}>Estimated refund: <strong>{formatINR(selected.estimated.refund)}</strong></p>
          {selected.estimated.deduction > 0 && (
            <p style={{ margin: "0.25rem 0 0", color: "hsl(var(--muted))" }}>
              {selected.estimated.deduction_label}: {formatINR(selected.estimated.deduction)}
            </p>
          )}
        </div>
      )}

      {isDoa && (
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
            Preference
          </label>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {(["refund", "replacement"] as const).map((v) => (
              <label key={v} style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem" }}>
                <input type="radio" name="doaPref" value={v} checked={doaPref === v} onChange={() => setDoaPref(v)} />
                {v === "refund" ? "Full refund" : "Replacement"}
              </label>
            ))}
          </div>
        </div>
      )}

      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.25rem" }}>
        Note (optional)
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        placeholder="Describe the issue"
        style={{ width: "100%", padding: "0.5rem", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", fontSize: "0.875rem", resize: "vertical", boxSizing: "border-box", marginBottom: "0.75rem" }}
      />

      <button
        disabled={!reason || raiseReturn.isPending}
        onClick={() =>
          raiseReturn.mutate(
            { orderId, reason, note: note || undefined, doaPreference: isDoa ? doaPref : undefined },
            { onSuccess: onDone },
          )
        }
        style={{
          padding: "0.625rem 1.25rem",
          backgroundColor: !reason ? "#9ca3af" : "#dc2626",
          color: "hsl(var(--primary-foreground))",
          border: "none",
          borderRadius: "0.75rem",
          cursor: !reason ? "default" : "pointer",
          fontSize: "0.875rem",
          fontWeight: 500,
        }}
      >
        {raiseReturn.isPending ? "Submitting..." : "Submit return request"}
      </button>

      {raiseReturn.isError && (
        <p style={{ color: "hsl(var(--destructive))", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          {(raiseReturn.error as Error).message}
        </p>
      )}
    </div>
  );
}
