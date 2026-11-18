"use client";

import { useState } from "react";
import { useCancelOrder } from "@/hooks/use-shop";
import { formatINR } from "@/lib/format";

interface Props {
  orderId: string;
  total: number;
  cancelEstimate: { refund: number; deduction: number } | null;
  onDone: () => void;
}

export function CancelDialog({ orderId, total, cancelEstimate, onDone }: Props) {
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const cancel = useCancelOrder();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ padding: "0.5rem 1rem", border: "1px solid #dc2626", borderRadius: 6, backgroundColor: "transparent", color: "#dc2626", cursor: "pointer", fontSize: "0.875rem" }}
      >
        Cancel order
      </button>
    );
  }

  return (
    <div style={{ border: "1px solid #fecaca", borderRadius: 8, padding: "1rem", backgroundColor: "#fef2f2" }}>
      <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.875rem", fontWeight: 600 }}>Cancel this order?</h4>
      {cancelEstimate && (
        <div style={{ fontSize: "0.875rem", marginBottom: "0.5rem" }}>
          <p style={{ margin: 0 }}>Refund: {formatINR(cancelEstimate.refund)}</p>
          {cancelEstimate.deduction > 0 && (
            <p style={{ margin: "0.125rem 0 0", color: "#991b1b" }}>
              Deduction: {formatINR(cancelEstimate.deduction)}
            </p>
          )}
        </div>
      )}
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason (optional)"
        rows={2}
        style={{ width: "100%", padding: "0.5rem", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: "0.875rem", resize: "vertical", boxSizing: "border-box" }}
      />
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <button
          onClick={() => cancel.mutate({ orderId, reason: reason || undefined }, { onSuccess: onDone })}
          disabled={cancel.isPending}
          style={{ padding: "0.5rem 1rem", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.875rem" }}
        >
          {cancel.isPending ? "Cancelling..." : "Confirm cancel"}
        </button>
        <button
          onClick={() => setOpen(false)}
          style={{ padding: "0.5rem 1rem", border: "1px solid #d1d5db", borderRadius: 6, backgroundColor: "transparent", cursor: "pointer", fontSize: "0.875rem" }}
        >
          Keep order
        </button>
      </div>
    </div>
  );
}
