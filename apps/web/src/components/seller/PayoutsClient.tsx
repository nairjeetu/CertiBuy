"use client";

import { useSellerPayouts } from "@/hooks/use-seller";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatINR, formatDate } from "@/lib/format";

interface PayoutItem {
  id: string;
  type: string;
  amount: number;
  status: string;
  statusLabel: string;
  trigger: string;
  model: { brand: string; name: string; storage: string } | null;
  createdAt: string;
}

export function PayoutsClient() {
  const { data, isLoading, error } = useSellerPayouts();

  if (isLoading) return <p>Loading payouts...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const payouts = ((data as { payouts?: PayoutItem[] })?.payouts ?? []) as PayoutItem[];

  if (payouts.length === 0) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", padding: "3rem 1rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>Payout history</h2>
        <p style={{ color: "#6b7280" }}>No payouts yet. Complete a sale to see payouts here.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>Payout history</h2>
      <div style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", overflow: "hidden" }}>
        {payouts.map((p) => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem 1rem", borderBottom: "1px solid #f3f4f6" }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: "0.875rem", textTransform: "capitalize" }}>
                {p.type.replace(/_/g, " ")}
              </div>
              {p.model && (
                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  {p.model.brand} {p.model.name} {p.model.storage}
                </div>
              )}
              <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{formatDate(p.createdAt)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 500 }}>{formatINR(p.amount)}</div>
              <StatusChip label={p.statusLabel} tone={p.status === "paid" ? "success" : p.status === "failed" ? "destructive" : "neutral"} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
