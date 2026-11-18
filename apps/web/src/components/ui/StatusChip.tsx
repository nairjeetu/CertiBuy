const toneStyles: Record<string, { bg: string; text: string }> = {
  success:     { bg: "hsl(var(--success) / 0.15)",     text: "hsl(var(--success))" },
  warning:     { bg: "hsl(var(--warning) / 0.15)",     text: "hsl(var(--warning))" },
  destructive: { bg: "hsl(var(--destructive) / 0.15)", text: "hsl(var(--destructive))" },
  neutral:     { bg: "hsl(var(--border))",              text: "hsl(var(--muted))" },
  info:        { bg: "hsl(var(--primary) / 0.1)",      text: "hsl(var(--primary))" },
};

export function StatusChip({ label, tone }: { label: string; tone: string }) {
  const s = toneStyles[tone] ?? toneStyles.neutral!;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.125rem 0.5rem",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 500,
        backgroundColor: s.bg,
        color: s.text,
      }}
    >
      {label}
    </span>
  );
}
