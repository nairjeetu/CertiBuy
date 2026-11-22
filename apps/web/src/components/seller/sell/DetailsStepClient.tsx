"use client";

import { useSubmissionWizard, useSaveDetails } from "@/hooks/use-seller";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { StepRail } from "./StepRail";
import { isValidImei } from "@certibuy/domain";

const COSMETIC_OPTIONS = [
  { value: "A", label: "Like new", hint: "No visible marks" },
  { value: "B", label: "Good", hint: "Minor scratches" },
  { value: "C", label: "Fair", hint: "Noticeable wear" },
  { value: "D", label: "Worn", hint: "Heavy wear or cracks" },
];

const REPAIR_OPTIONS = [
  { value: "no", label: "Never repaired" },
  { value: "authorised", label: "Authorised service centre" },
  { value: "other_shop", label: "Another shop" },
  { value: "not_sure", label: "Not sure" },
];

export function DetailsStepClient({ submissionId }: { submissionId: string }) {
  const isNew = submissionId === "new";
  const searchParams = useSearchParams();
  const modelId = searchParams.get("modelId") ?? "";
  const router = useRouter();
  const save = useSaveDetails();

  const { data: wizardRaw, isLoading } = useSubmissionWizard(isNew ? "" : submissionId);
  const wizard = wizardRaw as { model?: { id?: string } } | undefined;

  const [imei, setImei] = useState("");
  const [cosmetic, setCosmetic] = useState("B");
  const [repaired, setRepaired] = useState("no");
  const [waterExposure, setWaterExposure] = useState(false);
  const [error, setError] = useState("");

  const imeiValid = isValidImei(imei);
  const imeiRejected = imei.length === 15 && !imeiValid;

  if (!isNew && isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading...</p>;

  async function handleSubmit() {
    setError("");
    if (!isValidImei(imei)) {
      setError("Enter a valid 15-digit IMEI. Dial *#06# on the device to check it.");
      return;
    }
    try {
      const result = await save.mutateAsync({
        submissionId: isNew ? undefined : submissionId,
        deviceModelId: isNew ? modelId : wizard?.model?.id ?? modelId,
        imei,
        declaredCosmetic: cosmetic,
        repaired,
        waterExposure,
      });
      const id = (result as { id: string }).id;
      router.push(`/seller/sell/${id}/photos`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="details-page">
      <StepRail current={1} />
      <h1 className="details-title">Device details</h1>
      <p className="meta" style={{ marginBottom: "1.5rem" }}>Tell us about the condition. The technician will verify everything at the hub.</p>

      <div className="form-section surface">
        {/* IMEI */}
        <div className="form-group">
          <label className="field-label">IMEI (15 digits)</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={15}
            value={imei}
            onChange={(e) => setImei(e.target.value.replace(/\D/g, ""))}
            placeholder="Enter your 15-digit IMEI"
            className={`form-input ${imeiRejected ? "input-invalid" : ""}`}
            aria-invalid={imeiRejected}
          />
          {imeiRejected ? (
            <p className="field-invalid">
              That IMEI isn&apos;t valid — one of the digits is wrong. Dial *#06# on the device and check it before continuing.
            </p>
          ) : imeiValid ? (
            <p className="field-valid">IMEI checks out.</p>
          ) : (
            <p className="meta" style={{ marginTop: "0.25rem" }}>
              Dial *#06# to find your IMEI.{imei.length > 0 ? ` ${imei.length}/15 digits.` : ""}
            </p>
          )}
        </div>

        {/* Cosmetic condition */}
        <div className="form-group">
          <label className="field-label">Cosmetic condition</label>
          <div className="cosmetic-grid">
            {COSMETIC_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCosmetic(opt.value)}
                className={`radio-card ${cosmetic === opt.value ? "radio-card-active" : ""}`}
              >
                <span className="radio-card-grade">{opt.value}</span>
                <div>
                  <span className="radio-card-label">{opt.label}</span>
                  <span className="meta" style={{ display: "block" }}>{opt.hint}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Repair history */}
        <div className="form-group">
          <label className="field-label">Repair history</label>
          <div className="repair-list">
            {REPAIR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRepaired(opt.value)}
                className={`radio-row ${repaired === opt.value ? "radio-row-active" : ""}`}
              >
                <span className={`radio-dot ${repaired === opt.value ? "radio-dot-active" : ""}`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Water exposure */}
        <div className="form-group">
          <label className="water-label">
            <input
              type="checkbox"
              checked={waterExposure}
              onChange={(e) => setWaterExposure(e.target.checked)}
              className="water-check"
            />
            <div>
              <span className="field-label" style={{ marginBottom: 0 }}>Water exposure</span>
              <span className="meta" style={{ display: "block" }}>Has the device been exposed to water or moisture?</span>
            </div>
          </label>
        </div>
      </div>

      {error && <p className="error-msg">{error}</p>}

      <div className="actions">
        <button onClick={() => router.back()} className="btn-secondary">← Back</button>
        <button onClick={handleSubmit} disabled={save.isPending || !imeiValid} className="btn-primary">
          {save.isPending ? "Saving..." : "Next: Photos →"}
        </button>
      </div>

      <style jsx>{`
        .details-page {
          max-width: 560px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
        }
        .details-title {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 1.5rem;
          font-weight: 400;
          margin: 0 0 0.25rem;
          color: hsl(var(--foreground));
        }

        .form-section { padding: 1.25rem; }
        .form-group { margin-bottom: 1.25rem; }
        .form-group:last-child { margin-bottom: 0; }
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

        /* Cosmetic cards */
        .cosmetic-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }
        .radio-card {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          padding: 0.75rem;
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          background: hsl(var(--card));
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
        }
        .radio-card:hover { border-color: hsl(var(--muted)); }
        .radio-card-active {
          border-color: hsl(var(--primary));
          background: hsl(var(--primary) / 0.04);
        }
        .radio-card-grade {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 1.25rem;
          color: hsl(var(--foreground));
          line-height: 1;
          min-width: 1.5rem;
        }
        .radio-card-label { font-weight: 600; font-size: 0.875rem; color: hsl(var(--foreground)); }

        /* Repair radios */
        .repair-list {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .radio-row {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.625rem 0.75rem;
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          background: hsl(var(--card));
          cursor: pointer;
          font-size: 0.875rem;
          color: hsl(var(--foreground));
          transition: all 0.15s;
          text-align: left;
        }
        .radio-row:hover { border-color: hsl(var(--muted)); }
        .radio-row-active {
          border-color: hsl(var(--primary));
          background: hsl(var(--primary) / 0.04);
        }
        .radio-dot {
          width: 16px; height: 16px;
          border-radius: 50%;
          border: 2px solid hsl(var(--border));
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .radio-dot-active {
          border-color: hsl(var(--primary));
          background: hsl(var(--primary));
          box-shadow: inset 0 0 0 3px hsl(var(--card));
        }

        /* Water exposure */
        .water-label {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          cursor: pointer;
        }
        .water-check {
          width: 18px; height: 18px;
          margin-top: 0.125rem;
          accent-color: hsl(var(--primary));
        }

        .input-invalid {
          border-color: hsl(var(--destructive));
        }
        .field-invalid {
          margin-top: 0.25rem;
          font-size: 0.8125rem;
          line-height: 1.4;
          color: hsl(var(--destructive));
        }
        .field-valid {
          margin-top: 0.25rem;
          font-size: 0.8125rem;
          color: hsl(var(--muted));
        }
        .error-msg {
          color: hsl(var(--destructive));
          font-size: 0.875rem;
          margin-top: 0.75rem;
        }

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

        @media (max-width: 480px) {
          .cosmetic-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
