"use client";

import { GradeChip } from "../ui/GradeChip";
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
    <div className="summary-card surface" style={{ padding: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div>
          <p style={{ margin: 0, fontWeight: 600, color: "hsl(var(--foreground))" }}>{brand} {model}</p>
          <p className="meta" style={{ marginTop: "0.25rem" }}>{storage}</p>
        </div>
        <GradeChip grade={grade} />
      </div>
      <div style={{ borderTop: "1px solid hsl(var(--border))", paddingTop: "0.75rem" }}>
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
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid hsl(var(--border))" }}>
          <span>Total</span>
          <span>{formatINR(total)}</span>
        </div>
      </div>
    </div>
  );
}
