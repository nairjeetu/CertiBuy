"use client";

import { useSellerHome } from "@/hooks/use-seller";
import { StatusChip } from "@/components/ui/StatusChip";
import { DeviceImage } from "@/components/shop/DeviceImage";
import { formatINR } from "@/lib/format";
import Link from "next/link";

interface Deal {
  id: string;
  status: string;
  statusLabel: string;
  statusTone: string;
  model: { brand: string; name: string; storage: string };
  colour?: string;
  offer: { guaranteedPrice: number; icEligible: boolean } | null;
  chosenOption: string | null;
  nextAction: string;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "sold" || status === "deal_complete") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--success))" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  );
  if (status === "rejected" || status === "mismatch" || status === "returned_to_seller" || status === "cancelled") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--destructive))" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
  );
  if (status === "offer_accepted" || status === "graded" || status === "hub_booked") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--warning))" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  );
  if (status === "handed_over" || status === "in_transit" || status === "dispatched") return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
  );
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--muted))" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  );
}

export function SellerHomeClient() {
  const { data, isLoading, error } = useSellerHome();

  if (isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading your deals...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))", padding: "1rem" }}>{(error as Error).message}</p>;

  const deals = (data?.deals ?? []) as Deal[];
  const raw = data as unknown as { paidToYou?: number; stillDue?: number } | undefined;
  const stats = raw?.paidToYou !== undefined ? raw as { paidToYou: number; stillDue: number } : null;
  const activeCount = deals.filter((d) => !["sold", "returned_to_seller", "cancelled"].includes(d.status)).length;

  return (
    <div className="seller-page">
      {/* Hero */}
      <div className="seller-hero">
        <span className="hero-eyebrow">SELL TO CERTIBUY</span>
        <h1 className="hero-headline">Turn your old device into money, at a price you can trust.</h1>
        <p className="hero-body">A few honest answers, eight guided photos and a two-minute check, and you&apos;ll know both prices before you leave home.</p>
        <Link href="/seller/sell" className="hero-btn">Sell a device →</Link>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card surface">
          <span className="stat-label">Paid to you</span>
          <span className="stat-value">{formatINR(stats?.paidToYou ?? 0)}</span>
          <span className="meta">In your account</span>
        </div>
        <div className="stat-card surface">
          <span className="stat-label">Still due to you</span>
          <span className="stat-value">{formatINR(stats?.stillDue ?? 0)}</span>
          <span className="meta">Advance or balance, pending</span>
        </div>
        <div className="stat-card surface">
          <span className="stat-label">Active deals</span>
          <span className="stat-value-num">{activeCount}</span>
          <span className="meta">Devices still with you or in transit</span>
        </div>
      </div>

      {/* Deals */}
      <div className="deals-header">
        <h2 className="deals-title">Your deals</h2>
        <span className="meta">{deals.length} device{deals.length !== 1 ? "s" : ""}</span>
      </div>

      {deals.length === 0 ? (
        <div className="deals-empty surface">
          <p>No deals yet.</p>
          <p className="meta">Start a submission to get an offer for your device.</p>
        </div>
      ) : (
        <div className="deals-list">
          {deals.map((deal) => (
            <Link
              key={deal.id}
              href={deal.status === "draft" || deal.status === "graded" || deal.status === "offer_accepted"
                ? `/seller/sell/${deal.id}`
                : `/seller/deals/${deal.id}`}
              className="deal-card surface"
            >
              <div className="deal-card-img">
                <DeviceImage brand={deal.model.brand} model={deal.model.name} size="sm" />
              </div>
              <div className="deal-card-info">
                <div className="deal-card-name-row">
                  <StatusIcon status={deal.status} />
                  <span className="deal-card-name">{deal.model.brand} {deal.model.name}</span>
                  <StatusChip label={deal.statusLabel} tone={deal.statusTone} />
                </div>
                <p className="meta">{deal.model.storage}{deal.colour ? ` · ${deal.colour}` : ""}</p>
                <p className="deal-card-action">{deal.nextAction}</p>
              </div>
              <div className="deal-card-price">
                {deal.offer ? (
                  <span>{formatINR(deal.offer.guaranteedPrice)}</span>
                ) : (
                  <span className="meta">—</span>
                )}
                <span className="meta">{deal.chosenOption ? deal.chosenOption.replace(/_/g, " ") : "No offer chosen"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Help */}
      <div className="seller-help">
        <Link href="/help" className="seller-help-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Need help?
        </Link>
      </div>

      <style jsx>{`
        .seller-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
        }
        .seller-hero {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          padding: 2.5rem;
          border-radius: var(--radius);
          margin-bottom: 1.5rem;
        }
        .hero-eyebrow {
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          opacity: 0.7;
          margin-bottom: 0.75rem;
          display: block;
        }
        .hero-headline {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 1.75rem;
          font-weight: 400;
          line-height: 1.2;
          margin: 0 0 0.75rem;
        }
        .hero-body {
          font-size: 0.9375rem;
          opacity: 0.8;
          line-height: 1.5;
          max-width: 500px;
          margin: 0 0 1.25rem;
        }
        .hero-btn {
          display: inline-flex;
          align-items: center;
          padding: 0.625rem 1.25rem;
          border: 1px solid hsla(0, 0%, 100%, 0.3);
          border-radius: 9999px;
          color: hsl(var(--primary-foreground));
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 600;
          transition: background 0.15s;
        }
        .hero-btn:hover { background: hsla(0, 0%, 100%, 0.1); }

        /* Stats */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .stat-card { padding: 1.25rem; }
        .stat-label {
          display: block;
          font-size: 0.8125rem;
          color: hsl(var(--muted));
          margin-bottom: 0.25rem;
        }
        .stat-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: hsl(var(--warning));
          line-height: 1.2;
          margin-bottom: 0.25rem;
        }
        .stat-value-num {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: hsl(var(--foreground));
          line-height: 1.2;
          margin-bottom: 0.25rem;
        }

        /* Deals */
        .deals-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 0.75rem;
        }
        .deals-title {
          font-size: 1.0625rem;
          font-weight: 600;
          margin: 0;
          color: hsl(var(--foreground));
        }
        .deals-empty {
          text-align: center;
          padding: 3rem 1rem;
          color: hsl(var(--muted));
        }
        .deals-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .deal-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          text-decoration: none;
          color: inherit;
          transition: box-shadow 0.15s;
        }
        .deal-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .deal-card-img {
          width: 52px; height: 52px;
          background: hsl(var(--background));
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .deal-card-info { flex: 1; min-width: 0; }
        .deal-card-name-row {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          flex-wrap: wrap;
          margin-bottom: 0.25rem;
        }
        .deal-card-name { font-weight: 600; font-size: 1rem; }
        .deal-card-action {
          margin: 0.375rem 0 0;
          font-size: 0.8125rem;
          color: hsl(var(--muted));
        }
        .deal-card-price {
          text-align: right;
          font-weight: 600;
          font-size: 0.9375rem;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.125rem;
        }

        .seller-help { text-align: center; margin-top: 2rem; }
        .seller-help-link {
          display: inline-flex; align-items: center; gap: 0.375rem;
          font-size: 0.8125rem; color: hsl(var(--muted)); text-decoration: none;
        }
        .seller-help-link:hover { color: hsl(var(--foreground)); }

        @media (max-width: 640px) {
          .stats-row { grid-template-columns: 1fr; }
          .hero-headline { font-size: 1.375rem; }
          .seller-hero { padding: 1.5rem; }
          .deal-card { flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}
