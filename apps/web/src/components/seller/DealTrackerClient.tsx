"use client";

import { useDealTracker } from "@/hooks/use-seller";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatINR, formatDate } from "@/lib/format";
import Link from "next/link";

interface DealData {
  id: string;
  status: string;
  statusLabel: string;
  statusTone: string;
  model: { brand: string; name: string; storage: string };
  chosenOption: string | null;
  offer: {
    guaranteedPrice: number;
    instantCashAmount: number;
    icEligible: boolean;
    offerStatus: string;
    band: string[];
    expiresAt: string;
  } | null;
  booking: {
    date: string;
    slot: string;
    status: string;
    hubName: string;
    hubAddress: string;
  } | null;
  payouts: Array<{ id: string; type: string; amount: number; status: string; statusLabel: string; createdAt: string }>;
  timeline: Array<{ text: string; date: string; createdAt: string }>;
  nextAction: string;
}

export function DealTrackerClient({ submissionId }: { submissionId: string }) {
  const { data, isLoading, error } = useDealTracker(submissionId);

  if (isLoading) return <p>Loading deal...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const deal = data as unknown as DealData;
  if (!deal) return <p>Deal not found.</p>;

  const amount = deal.chosenOption === "instant_cash"
    ? deal.offer?.instantCashAmount
    : deal.offer?.guaranteedPrice;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>
              {deal.model.brand} {deal.model.name} {deal.model.storage}
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "#6b7280", margin: "0.25rem 0 0" }}>
              {deal.nextAction}
            </p>
          </div>
          <StatusChip label={deal.statusLabel} tone={deal.statusTone} />
        </div>
      </div>

      {/* Money card */}
      {deal.offer && (
        <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.875rem" }}>
              {deal.chosenOption === "instant_cash" ? "Instant Cash" : "Sell For More (guaranteed)"}
            </span>
            <span style={{ fontWeight: 600 }}>{amount ? formatINR(amount) : "—"}</span>
          </div>
          {deal.chosenOption === "sell_for_more" && (
            <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
              50% advance on handover, balance when sold or on day 21.
            </div>
          )}
        </div>
      )}

      {/* Booking card */}
      {deal.booking && (
        <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 500, margin: "0 0 0.5rem" }}>Inspection booking</h3>
          <div style={{ fontSize: "0.8125rem" }}>
            {deal.booking.hubName} · {deal.booking.date} at {deal.booking.slot}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{deal.booking.hubAddress}</div>
          <StatusChip label={deal.booking.status === "booked" ? "Booked" : deal.booking.status} tone={deal.booking.status === "booked" ? "info" : "neutral"} />
        </div>
      )}

      {/* Payments table */}
      {deal.payouts.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Payments</h3>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", overflow: "hidden" }}>
            {deal.payouts.map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 1rem", fontSize: "0.8125rem", borderBottom: "1px solid #f3f4f6" }}>
                <div>
                  <span style={{ textTransform: "capitalize" }}>{p.type.replace(/_/g, " ")}</span>
                  <span style={{ color: "#6b7280", marginLeft: "0.5rem" }}>· {formatDate(p.createdAt)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 500 }}>{formatINR(p.amount)}</span>
                  <StatusChip label={p.statusLabel} tone={p.status === "paid" ? "success" : p.status === "failed" ? "destructive" : "neutral"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {deal.timeline.length > 0 && (
        <div>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Timeline</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {deal.timeline.map((t, i) => (
              <div key={i} style={{ fontSize: "0.8125rem", display: "flex", gap: "0.5rem" }}>
                <span style={{ color: "#9ca3af", minWidth: 70 }}>{t.date}</span>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "1.5rem" }}>
        <Link href="/seller" style={{ fontSize: "0.875rem", color: "#2563eb", textDecoration: "none" }}>
          Back to seller home
        </Link>
      </div>
    </div>
  );
}
