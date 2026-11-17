"use client";

import { useSubmissionWizard, useWorkspace } from "@/hooks/use-seller";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { checkPhoto } from "@/lib/photo-check";

const PHOTO_TIPS: Record<string, string[]> = {
  phone: ["Front screen", "Back panel", "Top edge", "Bottom edge", "Left side", "Right side", "Camera lens", "Screen on (home screen)"],
  laptop: ["Lid closed", "Keyboard", "Screen on", "Left ports", "Right ports"],
  tablet: ["Front screen", "Back", "Screen on", "Top edge", "Bottom edge"],
  watch: ["Face", "Back", "Band left", "Band right", "Screen on"],
};

interface PhotoSlot {
  key: string;
  tip: string;
  file: File | null;
  brightness: number;
  ok: boolean;
  error?: string;
}

export function PhotosStepClient({ submissionId }: { submissionId: string }) {
  const { data: wizard, isLoading } = useSubmissionWizard(submissionId);
  const { data: ws } = useWorkspace();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [retakeCount, setRetakeCount] = useState(0);

  const category = (wizard as { model?: { category?: string } })?.model?.category ?? "phone";
  const tips = PHOTO_TIPS[category] ?? PHOTO_TIPS.phone!;
  const minPx = (ws as { settings?: { photoMinPx?: number } })?.settings?.photoMinPx ?? 600;
  const minBrightness = (ws as { settings?: { photoMinBrightness?: number } })?.settings?.photoMinBrightness ?? 60;

  const [slots, setSlots] = useState<PhotoSlot[]>(() =>
    tips.map((tip, i) => ({ key: `photo_${i}`, tip, file: null, brightness: 0, ok: false })),
  );

  if (isLoading) return <p>Loading...</p>;

  const allOk = slots.every((s) => s.ok);

  function handleSelectSlot(index: number) {
    setActiveSlot(index);
    fileRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || activeSlot === null) return;
    e.target.value = "";

    const result = await checkPhoto(file, minPx, minBrightness);
    const updated = [...slots];
    const wasOk = updated[activeSlot]!.ok;
    updated[activeSlot] = {
      ...updated[activeSlot]!,
      file,
      brightness: result.brightness,
      ok: result.ok,
      error: result.reason,
    };
    setSlots(updated);
    if (!result.ok && wasOk) setRetakeCount((c) => c + 1);
    if (!result.ok && !wasOk) setRetakeCount((c) => c + 1);
    setActiveSlot(null);
  }

  async function handleNext() {
    // In a real app, upload photos to Supabase Storage here.
    // For Phase 3, we store the photo metadata on the submission.
    const photoData = slots.map((s) => ({
      key: s.key,
      brightness: s.brightness,
      ok: s.ok,
    }));

    await fetch("/api/v1/commands/saveSubmissionPhotos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId,
        photos: photoData,
        retakeCount,
      }),
    });

    router.push(`/seller/sell/${submissionId}/diagnostics`);
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        Photos ({slots.filter((s) => s.ok).length}/{slots.length})
      </h2>
      <p style={{ fontSize: "0.8125rem", color: "#6b7280", marginBottom: "1rem" }}>
        Take a clear photo for each angle. Minimum {minPx}px, good lighting.
      </p>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        {slots.map((slot, i) => (
          <button
            key={slot.key}
            onClick={() => handleSelectSlot(i)}
            style={{
              padding: "0.75rem",
              border: slot.ok ? "2px solid #16a34a" : slot.error ? "2px solid #dc2626" : "1px dashed #d1d5db",
              borderRadius: "0.5rem",
              backgroundColor: slot.ok ? "#f0fdf4" : "#fff",
              cursor: "pointer",
              textAlign: "center",
              minHeight: 80,
            }}
          >
            <div style={{ fontSize: "0.8125rem", fontWeight: 500 }}>{slot.tip}</div>
            {slot.ok && <div style={{ fontSize: "0.6875rem", color: "#16a34a", marginTop: "0.25rem" }}>Done</div>}
            {slot.error && <div style={{ fontSize: "0.6875rem", color: "#dc2626", marginTop: "0.25rem" }}>{slot.error}</div>}
            {!slot.ok && !slot.error && <div style={{ fontSize: "0.6875rem", color: "#9ca3af", marginTop: "0.25rem" }}>Tap to capture</div>}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
        <button onClick={() => router.back()} style={{ padding: "0.5rem 1.25rem", backgroundColor: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem" }}>
          Back
        </button>
        <button onClick={handleNext} disabled={!allOk} style={{ padding: "0.5rem 1.25rem", backgroundColor: allOk ? "#2563eb" : "#9ca3af", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: allOk ? "pointer" : "not-allowed", fontSize: "0.875rem", fontWeight: 500 }}>
          Next: Diagnostics
        </button>
      </div>
    </div>
  );
}
