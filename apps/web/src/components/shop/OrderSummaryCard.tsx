"use client";

import { GradeBadge } from "./GradeBadge";
import { formatINR } from "@/lib/format";

interface Props {
  brand: string;
  model: string;
  storage: string;
  grade: string;
  devicePrice: number;
  warrantyAddonAmount?: number;
  total: number;
}

export function OrderSummaryCard({ brand, model, storage, grade, devicePrice, warrantyAddonAmount, total }: Props) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div>
          <p style={{ margin: 0, fontWeight: 600 }}>{brand} {model}</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#6b7280" }}>{storage}</p>
        </div>
        <GradeBadge grade={grade} />
      </div>
      <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
          <span>Device price</span>
          <span>{formatINR(devicePrice)}</span>
        </div>
        {!!warrantyAddonAmount && warrantyAddonAmount > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginBottom: "0.25rem" }}>
            <span>Warranty add-on</span>
            <span>{formatINR(warrantyAddonAmount)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #e5e7eb" }}>
          <span>Total</span>
          <span>{formatINR(total)}</span>
        </div>
      </div>
    </div>
  );
}
