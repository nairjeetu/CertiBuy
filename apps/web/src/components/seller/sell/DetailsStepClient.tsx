"use client";

import { useSubmissionWizard, useSaveDetails } from "@/hooks/use-seller";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

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

  if (!isNew && isLoading) return <p>Loading...</p>;

  async function handleSubmit() {
    setError("");
    if (!/^\d{15}$/.test(imei)) {
      setError("IMEI must be exactly 15 digits.");
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
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <StepRail current={0} />
      <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>Device details</h2>

      <label style={labelStyle}>IMEI (15 digits)</label>
      <input
        type="text"
        inputMode="numeric"
        maxLength={15}
        value={imei}
        onChange={(e) => setImei(e.target.value.replace(/\D/g, ""))}
        placeholder="Enter your 15-digit IMEI"
        style={inputStyle}
      />
      <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: "0.25rem 0 1rem" }}>
        Dial *#06# to find your IMEI.
      </p>

      <label style={labelStyle}>Cosmetic condition</label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
        {COSMETIC_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setCosmetic(opt.value)}
            style={{
              padding: "0.5rem",
              border: cosmetic === opt.value ? "2px solid #2563eb" : "1px solid #d1d5db",
              borderRadius: "0.375rem",
              backgroundColor: cosmetic === opt.value ? "#eff6ff" : "#fff",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>Grade {opt.value} — {opt.label}</div>
            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{opt.hint}</div>
          </button>
        ))}
      </div>

      <label style={labelStyle}>Repair history</label>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", marginBottom: "1rem" }}>
        {REPAIR_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRepaired(opt.value)}
            style={{
              padding: "0.5rem 0.75rem",
              border: repaired === opt.value ? "2px solid #2563eb" : "1px solid #d1d5db",
              borderRadius: "0.375rem",
              backgroundColor: repaired === opt.value ? "#eff6ff" : "#fff",
              cursor: "pointer",
              textAlign: "left",
              fontSize: "0.875rem",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input
          type="checkbox"
          checked={waterExposure}
          onChange={(e) => setWaterExposure(e.target.checked)}
        />
        Water exposure
      </label>

      {error && <p style={{ color: "#991b1b", fontSize: "0.875rem", marginTop: "0.5rem" }}>{error}</p>}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
        <button onClick={() => router.back()} style={secondaryBtnStyle}>Back</button>
        <button onClick={handleSubmit} disabled={save.isPending} style={primaryBtnStyle}>
          {save.isPending ? "Saving..." : "Next: Photos"}
        </button>
      </div>
    </div>
  );
}

function StepRail({ current }: { current: number }) {
  const steps = ["Details", "Photos", "Diagnostics", "Grade", "Offer", "Book"];
  return (
    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", overflowX: "auto" }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <div style={{
            width: 24, height: 24, borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 500,
            backgroundColor: i <= current ? "#2563eb" : "#e5e7eb",
            color: i <= current ? "#fff" : "#6b7280",
          }}>
            {i + 1}
          </div>
          <span style={{ fontSize: "0.75rem", color: i <= current ? "#1e40af" : "#9ca3af", whiteSpace: "nowrap" }}>{s}</span>
        </div>
      ))}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.375rem" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "0.875rem", boxSizing: "border-box" };
const primaryBtnStyle: React.CSSProperties = { padding: "0.5rem 1.25rem", backgroundColor: "#2563eb", color: "#fff", border: "none", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer" };
const secondaryBtnStyle: React.CSSProperties = { padding: "0.5rem 1.25rem", backgroundColor: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "0.875rem", cursor: "pointer" };
