"use client";

interface Props {
  imageUrl?: string;
  brand: string;
  model: string;
  category?: string;
}

function FallbackIcon({ category }: { category?: string }) {
  if (category === "laptop") {
    return (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    );
  }
  if (category === "tablet") {
    return (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
      </svg>
    );
  }
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
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
      gap: "0.375rem",
      color: "hsl(var(--muted))",
    }}>
      <FallbackIcon category={category} />
      <span style={{ fontSize: "0.75rem", fontWeight: 500, opacity: 0.6 }}>{brand}</span>
    </div>
  );
}
