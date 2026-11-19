"use client";

import { useState } from "react";
import { useVerifyIdentity, useRejectDevice } from "@/hooks/use-hub";

interface Props {
  submissionId: string;
  imei: string;
  report: {
    identityPassed: boolean;
    scannedImei: string | null;
    blacklistClear: boolean;
    activationLockOff: boolean;
  } | null;
}

export function IdentityStep({ submissionId, imei, report }: Props) {
  const [scannedImei, setScannedImei] = useState(report?.scannedImei ?? "");
  const [lockOff, setLockOff] = useState(report?.activationLockOff ?? false);
  const verify = useVerifyIdentity();
  const reject = useRejectDevice();

  const handleVerify = () => {
    if (!scannedImei.trim()) return;
    verify.mutate({ submissionId, scannedImei: scannedImei.trim(), activationLockOff: lockOff });
  };

  const result = verify.data as unknown as { passed: boolean; imeiMatch: boolean; blacklisted: boolean; activationLockOff: boolean } | undefined;

  return (
    <div>
      <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.75rem" }}>Identity verification</h3>

      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 500, marginBottom: "0.25rem" }}>
        Scan or enter IMEI
      </label>
      <input
        type="text"
        value={scannedImei}
        onChange={(e) => setScannedImei(e.target.value)}
        placeholder="IMEI number"
        style={{ display: "block", width: "100%", padding: "0.5rem", border: "1px solid hsl(var(--border))", borderRadius: "0.375rem", marginBottom: "0.5rem", fontSize: "0.875rem" }}
      />
      <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted))", marginBottom: "0.75rem" }}>
        Declared: {imei}
      </p>

      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8125rem", marginBottom: "1rem", cursor: "pointer" }}>
        <input type="checkbox" checked={lockOff} onChange={(e) => setLockOff(e.target.checked)} />
        Activation lock is off
      </label>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button
          onClick={handleVerify}
          disabled={verify.isPending || !scannedImei.trim()}
          style={{ padding: "0.5rem 1rem", backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem" }}
        >
          {verify.isPending ? "Verifying..." : "Verify identity"}
        </button>
        <button
          onClick={() => reject.mutate({ submissionId, reasonCode: "identity_failed", note: "Identity check failed at counter" })}
          disabled={reject.isPending}
          style={{ padding: "0.5rem 1rem", backgroundColor: "#fff", color: "hsl(var(--destructive))", border: "1px solid hsl(var(--destructive))", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem" }}
        >
          Reject
        </button>
      </div>

      {result && (
        <div style={{ marginTop: "1rem", padding: "0.75rem", borderRadius: "0.375rem", backgroundColor: result.passed ? "hsl(var(--success) / 0.05)" : "#fef2f2", border: `1px solid ${result.passed ? "#dcfce7" : "#fecaca"}` }}>
          <p style={{ fontWeight: 500, color: result.passed ? "hsl(var(--success))" : "#991b1b", margin: 0, fontSize: "0.875rem" }}>
            {result.passed ? "Identity passed" : "Identity failed"}
          </p>
          <ul style={{ fontSize: "0.75rem", color: "hsl(var(--foreground))", margin: "0.25rem 0 0", paddingLeft: "1rem" }}>
            <li>IMEI match: {result.imeiMatch ? "Yes" : "No"}</li>
            <li>Blacklist clear: {result.blacklisted ? "No — blacklisted" : "Yes"}</li>
            <li>Activation lock off: {result.activationLockOff ? "Yes" : "No"}</li>
          </ul>
        </div>
      )}

      {verify.error && <p style={{ color: "hsl(var(--destructive))", fontSize: "0.8125rem", marginTop: "0.5rem" }}>{(verify.error as Error).message}</p>}
      {reject.error && <p style={{ color: "hsl(var(--destructive))", fontSize: "0.8125rem", marginTop: "0.5rem" }}>{(reject.error as Error).message}</p>}
    </div>
  );
}
