"use client";

import { useMyOrders } from "@/hooks/use-shop";
import { StatusChip } from "@/components/ui/StatusChip";
import { GradeBadge } from "./GradeBadge";
import { formatINR } from "@/lib/format";
import Link from "next/link";

interface OrderItem {
  orderId: string; status: string; statusLabel: string; statusTone: string;
  brand: string; model: string; storage: string; grade: string;
  total: number; createdAt: string; hasOpenReturn: boolean;
}

export function MyOrdersClient() {
  const { data, isLoading, error } = useMyOrders();

  if (isLoading) return <p>Loading your orders...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const items = (data?.items ?? []) as OrderItem[];

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center", paddingTop: "3rem" }}>
        <p style={{ color: "#6b7280" }}>You have no orders yet.</p>
        <Link href="/shop" style={{ color: "#2563eb", textDecoration: "underline", fontSize: "0.875rem" }}>
          Browse devices
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>My orders</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {items.map((o) => (
          <Link
            key={o.orderId}
            href={`/shop/orders/${o.orderId}`}
            style={{ display: "block", border: "1px solid #e5e7eb", borderRadius: 8, padding: "1rem", textDecoration: "none", color: "inherit" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>{o.brand} {o.model}</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#6b7280" }}>{o.storage}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <GradeBadge grade={o.grade} />
                <StatusChip label={o.statusLabel} tone={o.statusTone} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "0.5rem" }}>
              <span style={{ fontWeight: 600 }}>{formatINR(o.total)}</span>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                {new Date(o.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
              </span>
            </div>
            {o.hasOpenReturn && (
              <p style={{ margin: "0.375rem 0 0", fontSize: "0.75rem", color: "#dc2626" }}>Return in progress</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
