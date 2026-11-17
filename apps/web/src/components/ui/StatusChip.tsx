const toneColors: Record<string, { bg: string; text: string }> = {
  success: { bg: "#dcfce7", text: "#166534" },
  warning: { bg: "#fef9c3", text: "#854d0e" },
  destructive: { bg: "#fecaca", text: "#991b1b" },
  neutral: { bg: "#f3f4f6", text: "#374151" },
  info: { bg: "#dbeafe", text: "#1e40af" },
};

export function StatusChip({ label, tone }: { label: string; tone: string }) {
  const colors = toneColors[tone] ?? toneColors.neutral!;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.125rem 0.5rem",
        borderRadius: "9999px",
        fontSize: "0.75rem",
        fontWeight: 500,
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {label}
    </span>
  );
}
