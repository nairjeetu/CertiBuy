"use client";

import { useOrderReceipt } from "@/hooks/use-shop";
import { OrderSummaryCard } from "./OrderSummaryCard";
import Link from "next/link";

export function ConfirmationClient({ orderId }: { orderId: string }) {
  const { data, isLoading, error } = useOrderReceipt(orderId);

  if (isLoading) return <p>Loading confirmation...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))" }}>{(error as Error).message}</p>;
  if (!data) return <p>Order not found.</p>;

  const d = data as {
    orderId: string; brand: string; model: string; storage: string; grade: string;
    devicePrice: number; warrantyAddon: boolean; warrantyAddonAmount: number;
    total: number; paymentMethod: string; escrowLabel: string; paidAt: string | null;
    returnWindowClosesAt: string | null;
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>&#10003;</div>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 0.25rem" }}>Order confirmed</h2>
      <p style={{ fontSize: "0.875rem", color: "hsl(var(--muted))", marginBottom: "1.5rem" }}>
        Order {d.orderId.slice(0, 8)} · {d.escrowLabel}
      </p>

      <div style={{ textAlign: "left" }}>
        <OrderSummaryCard
          brand={d.brand}
          model={d.model}
          storage={d.storage}
          grade={d.grade}
          devicePrice={d.devicePrice}
          warrantyAddonAmount={d.warrantyAddon ? d.warrantyAddonAmount : 0}
          total={d.total}
        />
      </div>

      <div style={{ marginTop: "1rem", fontSize: "0.875rem", color: "hsl(var(--muted))" }}>
        <p style={{ margin: "0.25rem 0" }}>Payment: {d.paymentMethod.toUpperCase()}</p>
        {d.returnWindowClosesAt && (
          <p style={{ margin: "0.25rem 0" }}>
            Return window closes: {new Date(d.returnWindowClosesAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", marginTop: "1.5rem" }}>
        <Link
          href={`/shop/orders/${d.orderId}`}
          style={{ padding: "0.625rem 1.25rem", backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderRadius: "0.75rem", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}
        >
          Track order
        </Link>
        <Link
          href="/shop"
          style={{ padding: "0.625rem 1.25rem", border: "1px solid hsl(var(--border))", borderRadius: "0.75rem", textDecoration: "none", color: "inherit", fontSize: "0.875rem" }}
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
