"use client";

import { useState } from "react";

interface Props {
  imageUrl?: string;
  brand: string;
  model: string;
  category?: string;
  size?: "sm" | "md" | "lg";
}

function placeholderPath(brand: string, category?: string): string {
  const cat = category ?? "phone";
  const brandKey = brand.toLowerCase();
  if (cat === "phone" && (brandKey === "apple" || brandKey === "samsung")) {
    return `/devices/phone-${brandKey}.svg`;
  }
  if (cat === "tablet") return "/devices/tablet-generic.svg";
  if (cat === "laptop") return "/devices/laptop-generic.svg";
  return "/devices/phone-generic.svg";
}

export function DeviceImage({ imageUrl, brand, model, category, size = "md" }: Props) {
  const [failed, setFailed] = useState(false);
  const src = imageUrl && !failed ? imageUrl : placeholderPath(brand, category);
  const dims = size === "lg" ? "100%" : size === "sm" ? "80%" : "85%";

  return (
    <img
      src={src}
      alt={`${brand} ${model}`}
      onError={() => setFailed(true)}
      style={{ maxWidth: dims, maxHeight: dims, objectFit: "contain" }}
    />
  );
}
