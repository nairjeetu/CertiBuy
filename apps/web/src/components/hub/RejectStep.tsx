"use client";

import { useState } from "react";
import { useRejectDevice } from "@/hooks/use-hub";

const REASONS = [
  { code: "imei_mismatch", label: "IMEI mismatch" },
  { code: "blacklisted", label: "Device blacklisted" },
  { code: "activation_lock", label: "Activation lock on" },
  { code: "stolen_report", label: "Stolen device report" },
  { code: "other", label: "Other" },
];

interface Props {
  submissionId: string;
}

export function RejectStep({ submissionId }: Props) {
  const [reasonCode, setReasonCode] = useState("imei_mismatch");
  const [note, setNote] = useState("");
  const reject = useRejectDevice();

  return (
    <div>
      <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Reject device</h3>

      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.25rem" }}>
        Reason
      </label>
      <select
        value={reasonCode}
        onChange={(e) => setReasonCode(e.target.value)}
        style={{ display: "block", width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", marginBottom: "0.5rem", fontSize: "0.875rem" }}
      >
        {REASONS.map((r) => (
          <option key={r.code} value={r.code}>{r.label}</option>
        ))}
      </select>

      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.25rem" }}>
        Note (optional)
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        style={{ display: "block", width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", marginBottom: "1rem", fontSize: "0.875rem", resize: "vertical" }}
      />

      <button
        onClick={() => reject.mutate({ submissionId, reasonCode, note: note || undefined })}
        disabled={reject.isPending}
        style={{ padding: "0.5rem 1rem", backgroundColor: "#dc2626", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem" }}
      >
        {reject.isPending ? "Rejecting..." : "Reject device"}
      </button>

      {reject.error && <p style={{ color: "#991b1b", fontSize: "0.8125rem", marginTop: "0.5rem" }}>{(reject.error as Error).message}</p>}
    </div>
  );
}
