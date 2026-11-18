"use client";

const TONES: Record<string, { bg: string; fg: string; label: string }> = {
  A: { bg: "#dcfce7", fg: "#166534", label: "Like new" },
  B: { bg: "#dbeafe", fg: "#1e40af", label: "Good" },
  C: { bg: "#fef9c3", fg: "#854d0e", label: "Fair" },
  D: { bg: "#fee2e2", fg: "#991b1b", label: "Refurbished" },
};

export function GradeBadge({ grade, className }: { grade: string; className?: string }) {
  const t = TONES[grade] ?? { bg: "#f3f4f6", fg: "#374151", label: grade };
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.1875rem 0.5rem",
        borderRadius: 6,
        fontSize: "0.6875rem",
        fontWeight: 600,
        letterSpacing: "0.01em",
        backgroundColor: t.bg,
        color: t.fg,
        whiteSpace: "nowrap",
        position: "absolute",
        top: "0.5rem",
        left: "0.5rem",
      }}
    >
      Grade {grade}
      <span style={{ fontWeight: 400, opacity: 0.8 }}>{t.label}</span>
    </span>
  );
}
