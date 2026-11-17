"use client";

import { useSaveDiagnostics } from "@/hooks/use-seller";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CHECKS = [
  { key: "battery", label: "Battery", hint: "Does the battery hold a charge?" },
  { key: "screen", label: "Screen and touch", hint: "No dead pixels, touch works everywhere?" },
  { key: "speakers", label: "Speakers", hint: "Play a sound — clear and loud?" },
  { key: "microphone", label: "Microphone", hint: "Record a voice note — plays back clearly?" },
  { key: "cameras", label: "Cameras", hint: "Front and back cameras take clear photos?" },
  { key: "charging", label: "Charging", hint: "Device charges when plugged in?" },
  { key: "sensors", label: "Sensors", hint: "Fingerprint, face ID, proximity — all working?" },
  { key: "imei_blacklist", label: "IMEI check", hint: "No block or restriction on the IMEI?" },
  { key: "activation_lock", label: "Activation lock", hint: "Lock is turned off?" },
];

type CheckValue = "pass" | "fail";

export function DiagnosticsStepClient({ submissionId }: { submissionId: string }) {
  const save = useSaveDiagnostics();
  const router = useRouter();
  const [checks, setChecks] = useState<Record<string, CheckValue>>({});
  const [batteryHealth, setBatteryHealth] = useState("90");
  const [error, setError] = useState("");

  const allAnswered = CHECKS.every((c) => checks[c.key] !== undefined);

  function toggle(key: string, value: CheckValue) {
    setChecks((prev) => ({ ...prev, [key]: value }));
  }

  async function handleNext() {
    setError("");
    const bh = parseInt(batteryHealth, 10);
    if (isNaN(bh) || bh < 0 || bh > 100) {
      setError("Battery health must be 0–100.");
      return;
    }
    if (!allAnswered) {
      setError("Answer every check.");
      return;
    }

    try {
      await save.mutateAsync({
        submissionId,
        diagnostics: {
          ...checks,
          activation_lock: checks.activation_lock === "pass" ? "off" : "on",
          battery_health: bh,
        },
      });
      router.push(`/seller/sell/${submissionId}/result`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>Diagnostics</h2>

      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.375rem" }}>
        Battery health (%)
      </label>
      <input
        type="number"
        min={0}
        max={100}
        value={batteryHealth}
        onChange={(e) => setBatteryHealth(e.target.value)}
        style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "0.875rem", marginBottom: "1rem", boxSizing: "border-box" }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {CHECKS.map((c) => (
          <div key={c.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", border: "1px solid #e5e7eb", borderRadius: "0.375rem" }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{c.label}</div>
              <div style={{ fontSize: "0.6875rem", color: "#6b7280" }}>{c.hint}</div>
            </div>
            <div style={{ display: "flex", gap: "0.375rem" }}>
              <button
                onClick={() => toggle(c.key, "pass")}
                style={{
                  padding: "0.25rem 0.625rem",
                  borderRadius: "0.25rem",
                  border: checks[c.key] === "pass" ? "2px solid #16a34a" : "1px solid #d1d5db",
                  backgroundColor: checks[c.key] === "pass" ? "#f0fdf4" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                }}
              >
                Pass
              </button>
              <button
                onClick={() => toggle(c.key, "fail")}
                style={{
                  padding: "0.25rem 0.625rem",
                  borderRadius: "0.25rem",
                  border: checks[c.key] === "fail" ? "2px solid #dc2626" : "1px solid #d1d5db",
                  backgroundColor: checks[c.key] === "fail" ? "#fef2f2" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                }}
              >
                Fail
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && <p style={{ color: "#991b1b", fontSize: "0.875rem", marginTop: "0.75rem" }}>{error}</p>}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
        <button onClick={() => router.back()} style={{ padding: "0.5rem 1.25rem", backgroundColor: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem" }}>
          Back
        </button>
        <button onClick={handleNext} disabled={!allAnswered || save.isPending} style={{ padding: "0.5rem 1.25rem", backgroundColor: allAnswered ? "#2563eb" : "#9ca3af", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: allAnswered ? "pointer" : "not-allowed", fontSize: "0.875rem", fontWeight: 500 }}>
          {save.isPending ? "Saving..." : "Next: Get grade"}
        </button>
      </div>
    </div>
  );
}
