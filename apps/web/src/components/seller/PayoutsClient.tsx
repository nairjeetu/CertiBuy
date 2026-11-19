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

  if (isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading payouts...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))", padding: "1rem" }}>{(error as Error).message}</p>;

  const payouts = ((data as { payouts?: PayoutItem[] })?.payouts ?? []) as PayoutItem[];

  return (
    <div className="payouts-page">
      <h1 className="payouts-title">Payout history</h1>
      <p className="meta" style={{ marginBottom: "1.25rem" }}>All payments made to you for devices sold through CertiBuy.</p>

      {payouts.length === 0 ? (
        <div className="empty surface">
          <p>No payouts yet.</p>
          <p className="meta">Complete a sale to see payouts here.</p>
        </div>
      ) : (
        <div className="payout-list surface">
          {payouts.map((p) => (
            <div key={p.id} className="payout-row">
              <div className="payout-info">
                <span className="payout-type">{p.type.replace(/_/g, " ")}</span>
                {p.model && <span className="meta">{p.model.brand} {p.model.name} {p.model.storage}</span>}
                <span className="meta">{formatDate(p.createdAt)}</span>
              </div>
              <div className="payout-right">
                <span className="payout-amount">{formatINR(p.amount)}</span>
                <StatusChip label={p.statusLabel} tone={p.status === "paid" ? "success" : p.status === "failed" ? "destructive" : "neutral"} />
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .payouts-page {
          max-width: 640px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
        }
        .payouts-title {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 1.5rem;
          font-weight: 400;
          margin: 0 0 0.25rem;
          color: hsl(var(--foreground));
        }
        .empty {
          text-align: center;
          padding: 3rem 1rem;
          color: hsl(var(--muted));
        }
        .empty p { margin: 0.25rem 0; }
        .payout-list { overflow: hidden; }
        .payout-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid hsl(var(--border));
        }
        .payout-row:last-child { border-bottom: none; }
        .payout-info {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .payout-type {
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: capitalize;
          color: hsl(var(--foreground));
        }
        .payout-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.25rem;
        }
        .payout-amount {
          font-weight: 700;
          font-size: 0.9375rem;
          color: hsl(var(--foreground));
        }
      `}</style>
    </div>
  );
}
