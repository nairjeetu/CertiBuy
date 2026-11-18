const GRADES: Record<string, { bg: string; fg: string; label: string }> = {
  A: { bg: "hsl(160 84% 92%)", fg: "hsl(160 84% 25%)", label: "Like new" },
  B: { bg: "hsl(213 82% 92%)", fg: "hsl(213 82% 30%)", label: "Good" },
  C: { bg: "hsl(35 78% 90%)",  fg: "hsl(35 71% 28%)",  label: "Fair" },
  D: { bg: "hsl(215 20% 93%)", fg: "hsl(215 16% 40%)", label: "Value" },
};

export function GradeChip({ grade, size = "sm" }: { grade: string; size?: "sm" | "md" }) {
  const g = GRADES[grade] ?? GRADES.D!;
  const px = size === "md" ? "0.5rem 0.75rem" : "0.1875rem 0.5rem";
  const fs = size === "md" ? "0.8125rem" : "0.6875rem";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem",
        padding: px,
        borderRadius: "6px",
        fontSize: fs,
        fontWeight: 600,
        letterSpacing: "0.01em",
        backgroundColor: g.bg,
        color: g.fg,
        whiteSpace: "nowrap",
      }}
    >
      Grade {grade}
      <span style={{ fontWeight: 400, opacity: 0.8 }}>{g.label}</span>
    </span>
  );
}
