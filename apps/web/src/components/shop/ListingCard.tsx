"use client";

import Link from "next/link";
import { GradeBadge } from "./GradeBadge";
import { formatINR } from "@/lib/format";

interface Props {
  listingId: string;
  brand: string;
  model: string;
  storage: string;
  grade: string;
  currentPrice: number;
  warrantyMonths: number;
}

export function ListingCard({ listingId, brand, model, storage, grade, currentPrice, warrantyMonths }: Props) {
  return (
    <Link
      href={`/shop/${listingId}`}
      style={{
        display: "block",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "1rem",
        textDecoration: "none",
        color: "inherit",
        transition: "box-shadow 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: 0, fontWeight: 600 }}>{brand} {model}</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#6b7280" }}>{storage}</p>
        </div>
        <GradeBadge grade={grade} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "0.75rem" }}>
        <span style={{ fontSize: "1.125rem", fontWeight: 700 }}>{formatINR(currentPrice)}</span>
        {warrantyMonths > 0 && (
          <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{warrantyMonths} mo warranty</span>
        )}
      </div>
    </Link>
  );
}
