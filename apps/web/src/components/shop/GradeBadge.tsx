"use client";

const TONES: Record<string, { bg: string; fg: string }> = {
  A: { bg: "#dcfce7", fg: "#166534" },
  B: { bg: "#dbeafe", fg: "#1e40af" },
  C: { bg: "#fef9c3", fg: "#854d0e" },
  D: { bg: "#fee2e2", fg: "#991b1b" },
};

export function GradeBadge({ grade }: { grade: string }) {
  const t = TONES[grade] ?? { bg: "#f3f4f6", fg: "#374151" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.125rem 0.5rem",
        borderRadius: 4,
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: t.bg,
        color: t.fg,
      }}
    >
      Grade {grade}
    </span>
  );
}
