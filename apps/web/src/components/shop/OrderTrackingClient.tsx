"use client";

import { useOrderTracking, useAdvanceShipment } from "@/hooks/use-shop";
import { StatusChip } from "@/components/ui/StatusChip";
import { OrderSummaryCard } from "./OrderSummaryCard";
import { ShipmentTimeline } from "./ShipmentTimeline";
import { CancelDialog } from "./CancelDialog";
import { formatINR } from "@/lib/format";
import Link from "next/link";
export function OrderTrackingClient({ orderId }: { orderId: string }) {
  const { data, isLoading, error, refetch } = useOrderTracking(orderId);
  const advance = useAdvanceShipment();

  if (isLoading) return <p>Loading order...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;
  if (!data) return <p>Order not found.</p>;

  const d = data as {
    orderId: string; status: string; statusLabel: string; statusTone: string;
    brand: string; model: string; storage: string; grade: string;
    total: number; devicePrice: number; warrantyAddonAmount: number;
    paymentMethod: string; paidAt: string | null; deliveredAt: string | null;
    returnWindowClosesAt: string | null; returnDaysLeft: number | null;
    escrowStatus: string; escrowLabel: string; refundAmount: number | null;
    timeline: { status: string; notes: string | null; createdAt: string }[];
    canCancel: boolean;
    cancelEstimate: { refund: number; deduction: number } | null;
    canReturn: boolean;
    openReturn: { id: string; status: string; statusLabel: string; reason: string; outcome: string | null; refundAmount: number | null } | null;
  };

  const showAdvance = ["paid", "dispatched", "in_transit"].includes(d.status);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <Link href="/shop/orders" style={{ fontSize: "0.875rem", color: "#2563eb", textDecoration: "none" }}>
        Back to orders
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Order {d.orderId.slice(0, 8)}</h2>
        <StatusChip label={d.statusLabel} tone={d.statusTone} />
      </div>

      <OrderSummaryCard
        brand={d.brand}
        model={d.model}
        storage={d.storage}
        grade={d.grade}
        devicePrice={d.devicePrice}
        warrantyAddonAmount={d.warrantyAddonAmount}
        total={d.total}
      />

      <div style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
          <span style={{ color: "#6b7280" }}>Payment</span><span>{d.paymentMethod.toUpperCase()}</span>
          <span style={{ color: "#6b7280" }}>Escrow</span><span>{d.escrowLabel}</span>
          {d.refundAmount != null && d.refundAmount > 0 && (
            <><span style={{ color: "#6b7280" }}>Refund</span><span>{formatINR(d.refundAmount)}</span></>
          )}
          {d.returnDaysLeft != null && d.returnDaysLeft > 0 && (
            <><span style={{ color: "#6b7280" }}>Return window</span><span>{d.returnDaysLeft} days left</span></>
          )}
        </div>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.75rem" }}>Shipment timeline</h3>
        <ShipmentTimeline entries={d.timeline} />
      </div>

      {showAdvance && (
        <button
          onClick={() => advance.mutate({ orderId }, { onSuccess: () => refetch() })}
          disabled={advance.isPending}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          {advance.isPending ? "Advancing..." : "Advance shipment (demo)"}
        </button>
      )}

      {d.openReturn && (
        <div style={{ marginTop: "1.5rem", border: "1px solid #fecaca", borderRadius: 8, padding: "1rem", backgroundColor: "#fef2f2" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.5rem" }}>Return request</h3>
          <div style={{ fontSize: "0.875rem" }}>
            <p style={{ margin: 0 }}>Status: {d.openReturn.statusLabel}</p>
            <p style={{ margin: "0.25rem 0 0" }}>Reason: {d.openReturn.reason.replace(/_/g, " ")}</p>
            {d.openReturn.outcome && <p style={{ margin: "0.25rem 0 0" }}>Outcome: {d.openReturn.outcome.replace(/_/g, " ")}</p>}
            {d.openReturn.refundAmount != null && d.openReturn.refundAmount > 0 && (
              <p style={{ margin: "0.25rem 0 0" }}>Refund: {formatINR(d.openReturn.refundAmount)}</p>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem", flexWrap: "wrap" }}>
        {d.canCancel && (
          <CancelDialog orderId={orderId} total={d.total} cancelEstimate={d.cancelEstimate} onDone={() => refetch()} />
        )}
        {d.canReturn && (
          <Link
            href={`/shop/orders/${orderId}/return`}
            style={{ padding: "0.5rem 1rem", border: "1px solid #dc2626", borderRadius: 6, color: "#dc2626", textDecoration: "none", fontSize: "0.875rem" }}
          >
            Raise a return
          </Link>
        )}
      </div>
    </div>
  );
}
