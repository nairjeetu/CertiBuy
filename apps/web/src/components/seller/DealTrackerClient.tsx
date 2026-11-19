"use client";

import { useDealTracker } from "@/hooks/use-seller";
import { StatusChip } from "@/components/ui/StatusChip";
import { DeviceImage } from "@/components/shop/DeviceImage";
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

  if (isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading deal...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))", padding: "1rem" }}>{(error as Error).message}</p>;

  const deal = data as unknown as DealData;
  if (!deal) return <p>Deal not found.</p>;

  const amount = deal.chosenOption === "instant_cash"
    ? deal.offer?.instantCashAmount
    : deal.offer?.guaranteedPrice;

  return (
    <div className="deal-page">
      {/* Header */}
      <div className="deal-header surface">
        <div className="deal-header-img">
          <DeviceImage brand={deal.model.brand} model={deal.model.name} size="sm" />
        </div>
        <div className="deal-header-info">
          <h1 className="deal-header-name">{deal.model.brand} {deal.model.name}</h1>
          <p className="meta" style={{ margin: 0 }}>{deal.model.storage} · {deal.nextAction}</p>
        </div>
        <StatusChip label={deal.statusLabel} tone={deal.statusTone} />
      </div>

      {/* Money card */}
      {deal.offer && (
        <div className="card surface">
          <div className="card-row">
            <span>{deal.chosenOption === "instant_cash" ? "Instant Cash" : "Sell For More (guaranteed)"}</span>
            <span className="card-amount">{amount ? formatINR(amount) : "—"}</span>
          </div>
          {deal.chosenOption === "sell_for_more" && (
            <p className="meta" style={{ margin: "0.25rem 0 0" }}>50% advance on handover, balance when sold or on day 21.</p>
          )}
        </div>
      )}

      {/* Booking card */}
      {deal.booking && (
        <div className="card surface">
          <h3 className="card-heading">Inspection booking</h3>
          <p style={{ margin: 0, fontSize: "0.875rem" }}>{deal.booking.hubName} · {deal.booking.date} at {deal.booking.slot}</p>
          <p className="meta" style={{ margin: "0.125rem 0 0.5rem" }}>{deal.booking.hubAddress}</p>
          <StatusChip label={deal.booking.status === "booked" ? "Booked" : deal.booking.status} tone={deal.booking.status === "booked" ? "info" : "neutral"} />
        </div>
      )}

      {/* Payments */}
      {deal.payouts.length > 0 && (
        <div className="card surface">
          <h3 className="card-heading">Payments</h3>
          <div className="payment-list">
            {deal.payouts.map((p) => (
              <div key={p.id} className="payment-row">
                <div>
                  <span style={{ textTransform: "capitalize" }}>{p.type.replace(/_/g, " ")}</span>
                  <span className="meta" style={{ marginLeft: "0.5rem" }}>· {formatDate(p.createdAt)}</span>
                </div>
                <div className="payment-right">
                  <span className="payment-amount">{formatINR(p.amount)}</span>
                  <StatusChip label={p.statusLabel} tone={p.status === "paid" ? "success" : p.status === "failed" ? "destructive" : "neutral"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {deal.timeline.length > 0 && (
        <div className="card surface">
          <h3 className="card-heading">Timeline</h3>
          <div className="timeline">
            {deal.timeline.map((t, i) => (
              <div key={i} className="timeline-row">
                <span className="timeline-date">{t.date}</span>
                <span>{t.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="back-link-row">
        <Link href="/seller" className="back-link">← Back to seller home</Link>
      </div>

      <style jsx>{`
        .deal-page {
          max-width: 640px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .deal-header {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
        }
        .deal-header-img {
          width: 48px; height: 48px;
          background: hsl(var(--background));
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .deal-header-info { flex: 1; }
        .deal-header-name { font-size: 1.0625rem; font-weight: 600; margin: 0; color: hsl(var(--foreground)); }

        .card { padding: 1rem 1.25rem; }
        .card-heading { font-size: 0.9375rem; font-weight: 600; margin: 0 0 0.5rem; color: hsl(var(--foreground)); }
        .card-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: hsl(var(--foreground));
        }
        .card-amount { font-weight: 700; }

        .payment-list { display: flex; flex-direction: column; }
        .payment-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          font-size: 0.8125rem;
          border-bottom: 1px solid hsl(var(--border));
        }
        .payment-row:last-child { border-bottom: none; }
        .payment-right { display: flex; align-items: center; gap: 0.5rem; }
        .payment-amount { font-weight: 600; }

        .timeline { display: flex; flex-direction: column; gap: 0.375rem; }
        .timeline-row { font-size: 0.8125rem; display: flex; gap: 0.5rem; color: hsl(var(--foreground)); }
        .timeline-date { color: hsl(var(--muted)); min-width: 70px; }

        .back-link-row { margin-top: 0.5rem; }
        .back-link { font-size: 0.875rem; color: hsl(var(--primary)); text-decoration: none; }
        .back-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
