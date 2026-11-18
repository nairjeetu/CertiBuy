"use client";

const CATEGORY_ICONS: Record<string, string> = {
  phone: "📱",
  tablet: "📱",
  laptop: "💻",
  watch: "⌚",
};

interface Props {
  imageUrl?: string;
  brand: string;
  model: string;
  category?: string;
}

export function DeviceImage({ imageUrl, brand, model, category }: Props) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${brand} ${model}`}
        style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain" }}
      />
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.25rem",
      color: "var(--muted)",
    }}>
      <span style={{ fontSize: "2.5rem" }}>{CATEGORY_ICONS[category ?? "phone"] ?? "📱"}</span>
      <span style={{ fontSize: "0.75rem", fontWeight: 500, opacity: 0.7 }}>{brand}</span>
    </div>
  );
}
