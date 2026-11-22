"use client";

import { useSubmissionWizard, useWorkspace } from "@/hooks/use-seller";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { checkPhoto } from "@/lib/photo-check";
import { StepRail } from "./StepRail";

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

  if (isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading...</p>;

  const allOk = slots.every((s) => s.ok);
  const doneCount = slots.filter((s) => s.ok).length;

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

  const [saving, setSaving] = useState(false);

  async function handleNext() {
    setSaving(true);
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
    <div className="photos-page">
      <StepRail current={2} />
      <h1 className="photos-title">
        Photos
        <span className="photos-count">{doneCount}/{slots.length}</span>
      </h1>
      <p className="meta" style={{ marginBottom: "1.25rem" }}>
        Take a clear photo for each angle. Minimum {minPx}px, good lighting.
      </p>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />

      <div className="photo-grid">
        {slots.map((slot, i) => (
          <button
            key={slot.key}
            onClick={() => handleSelectSlot(i)}
            className={`photo-slot surface ${slot.ok ? "slot-done" : ""} ${slot.error ? "slot-error" : ""}`}
          >
            <div className="slot-icon">
              {slot.ok ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--success))" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              )}
            </div>
            <span className="slot-tip">{slot.tip}</span>
            {slot.ok && <span className="slot-status slot-status-ok">Done</span>}
            {slot.error && <span className="slot-status slot-status-err">{slot.error}</span>}
            {!slot.ok && !slot.error && <span className="slot-status">Tap to capture</span>}
          </button>
        ))}
      </div>

      <div className="actions">
        <button onClick={() => router.back()} className="btn-secondary">← Back</button>
        <button onClick={handleNext} disabled={!allOk || saving} className="btn-primary">
          {saving ? "Saving..." : "Next: Diagnostics →"}
        </button>
      </div>

      <style jsx>{`
        .photos-page {
          max-width: 560px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
        }
        .photos-title {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 1.5rem;
          font-weight: 400;
          margin: 0 0 0.25rem;
          color: hsl(var(--foreground));
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }
        .photos-count {
          font-family: var(--font-body);
          font-style: normal;
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(var(--muted));
        }

        .photo-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .photo-slot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.375rem;
          padding: 1rem 0.75rem;
          cursor: pointer;
          text-align: center;
          min-height: 90px;
          border: none;
          transition: all 0.15s;
        }
        .photo-slot:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .slot-done {
          outline: 2px solid hsl(var(--success));
          outline-offset: -2px;
          background: hsl(var(--success) / 0.04);
        }
        .slot-error {
          outline: 2px solid hsl(var(--destructive));
          outline-offset: -2px;
        }
        .slot-icon {
          color: hsl(var(--muted));
        }
        .slot-tip {
          font-size: 0.8125rem;
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        .slot-status {
          font-size: 0.6875rem;
          color: hsl(var(--muted));
        }
        .slot-status-ok { color: hsl(var(--success)); }
        .slot-status-err { color: hsl(var(--destructive)); }

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
          .photo-grid { grid-template-columns: 1fr 1fr; gap: 0.5rem; }
          .photo-slot { min-height: 80px; padding: 0.75rem 0.5rem; }
        }
      `}</style>
    </div>
  );
}
