"use client";

import { useSaveDiagnostics } from "@/hooks/use-seller";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StepRail } from "./StepRail";

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
    <div className="diag-page">
      <StepRail current={3} />
      <h1 className="diag-title">Diagnostics</h1>
      <p className="meta" style={{ marginBottom: "1.25rem" }}>Run each test on the device now. The technician will verify at the hub.</p>

      <div className="form-section surface">
        <div className="form-group">
          <label className="field-label">Battery health (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={batteryHealth}
            onChange={(e) => setBatteryHealth(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="check-list">
          {CHECKS.map((c) => (
            <div key={c.key} className="check-row">
              <div className="check-info">
                <span className="check-label">{c.label}</span>
                <span className="meta">{c.hint}</span>
              </div>
              <div className="check-btns">
                <button
                  type="button"
                  onClick={() => toggle(c.key, "pass")}
                  className={`check-btn ${checks[c.key] === "pass" ? "check-pass" : ""}`}
                >Pass</button>
                <button
                  type="button"
                  onClick={() => toggle(c.key, "fail")}
                  className={`check-btn ${checks[c.key] === "fail" ? "check-fail" : ""}`}
                >Fail</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <div className="actions">
        <button onClick={() => router.back()} className="btn-secondary">← Back</button>
        <button onClick={handleNext} disabled={!allAnswered || save.isPending} className="btn-primary">
          {save.isPending ? "Saving..." : "Next: Get grade →"}
        </button>
      </div>

      <style jsx>{`
        .diag-page {
          max-width: 560px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
        }
        .diag-title {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 1.5rem;
          font-weight: 400;
          margin: 0 0 0.25rem;
          color: hsl(var(--foreground));
        }
        .form-section { padding: 1.25rem; }
        .form-group { margin-bottom: 1.25rem; }
        .form-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid hsl(var(--input));
          border-radius: 0.875rem;
          font-size: 0.9375rem;
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          box-sizing: border-box;
        }
        .form-input:focus { outline: 2px solid hsl(var(--ring)); outline-offset: 1px; }

        .check-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .check-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.625rem 0.75rem;
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
        }
        .check-info { display: flex; flex-direction: column; gap: 0.125rem; }
        .check-label { font-weight: 600; font-size: 0.875rem; color: hsl(var(--foreground)); }
        .check-btns { display: flex; gap: 0.375rem; }
        .check-btn {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--card));
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 600;
          color: hsl(var(--foreground));
          transition: all 0.15s;
        }
        .check-pass {
          border-color: hsl(var(--success));
          background: hsl(var(--success) / 0.08);
          color: hsl(var(--success));
        }
        .check-fail {
          border-color: hsl(var(--destructive));
          background: hsl(var(--destructive) / 0.08);
          color: hsl(var(--destructive));
        }

        .error-msg { color: hsl(var(--destructive)); font-size: 0.875rem; margin-top: 0.75rem; }

        .actions {
          display: flex;
          justify-content: space-between;
          margin-top: 1.5rem;
        }
        .btn-primary {
          padding: 0.625rem 1.5rem;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border: none;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.5; cursor: default; }
        .btn-secondary {
          padding: 0.625rem 1.25rem;
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          border: 1px solid hsl(var(--border));
          border-radius: 9999px;
          font-size: 0.875rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-secondary:hover { background: hsl(var(--secondary)); }
      `}</style>
    </div>
  );
}
