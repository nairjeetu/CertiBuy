"use client";

import { useOfferDetail } from "@/hooks/use-seller";
import { formatINR, formatDate } from "@/lib/format";
import { IC_REASON_COPY } from "@certibuy/contracts";
import { StepRail } from "./StepRail";
import Link from "next/link";

interface OfferData {
  marketPrice: number;
  inspectionFee: number;
  riskDeduction: number;
  guaranteedPrice: number;
  instantCashAmount: number;
  icEligible: boolean;
  icReason: string | null;
  riskPct: number;
  band: string[];
  expiresAt: string;
  offerStatus: string;
  chosenOption: string | null;
  model: { brand: string; name: string; storage: string };
}

export function OfferClient({ submissionId }: { submissionId: string }) {
  const { data, isLoading, error } = useOfferDetail(submissionId);

  if (isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading offer...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))", padding: "1rem" }}>{(error as Error).message}</p>;

  const offer = data as unknown as OfferData;
  if (!offer) return <p>No offer found.</p>;

  const alreadyAccepted = offer.offerStatus === "accepted" || offer.chosenOption;

  return (
    <div className="offer-page">
      <StepRail current={5} />
      <h1 className="offer-title">Your offer</h1>
      <p className="meta">{offer.model.brand} {offer.model.name} · {offer.model.storage} · Band {offer.band.join("–")} · Expires {formatDate(offer.expiresAt)}</p>

      {/* Price breakdown */}
      <div className="breakdown surface">
        <div className="row"><span>Market price</span><span>{formatINR(offer.marketPrice)}</span></div>
        <div className="row"><span>Inspection fee</span><span>−{formatINR(offer.inspectionFee)}</span></div>
        <div className="row"><span>Risk deduction ({offer.riskPct}%)</span><span>−{formatINR(offer.riskDeduction)}</span></div>
        <div className="row row-total"><span>Sell For More (guaranteed)</span><span>{formatINR(offer.guaranteedPrice)}</span></div>
      </div>

      {/* IC availability */}
      {offer.icEligible ? (
        <div className="ic-card ic-eligible surface">
          <div className="ic-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--success))" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <div>
            <span className="ic-label">Instant Cash available: {formatINR(offer.instantCashAmount)}</span>
            <span className="meta" style={{ display: "block" }}>Get paid the full amount immediately at the hub.</span>
          </div>
        </div>
      ) : (
        <div className="ic-card ic-ineligible surface">
          <div className="ic-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--warning))" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <span className="ic-label">Instant Cash not available</span>
            <span className="meta" style={{ display: "block" }}>{offer.icReason ? IC_REASON_COPY[offer.icReason] ?? offer.icReason : ""}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      {alreadyAccepted ? (
        <div className="accepted-state">
          <p className="accepted-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--success))" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            Offer accepted ({offer.chosenOption === "instant_cash" ? "Instant Cash" : "Sell For More"})
          </p>
          <Link href={`/seller/sell/${submissionId}/hub`} className="btn-primary">Book inspection →</Link>
        </div>
      ) : (
        <Link href={`/seller/sell/${submissionId}/confirm`} className="btn-primary" style={{ display: "inline-block", marginTop: "1.5rem" }}>Choose how you get paid →</Link>
      )}

      <style jsx>{`
        .offer-page {
          max-width: 560px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
        }
        .offer-title {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 1.5rem;
          font-weight: 400;
          margin: 0 0 0.25rem;
          color: hsl(var(--foreground));
        }
        .breakdown {
          margin-top: 1.25rem;
          overflow: hidden;
        }
        .row {
          display: flex;
          justify-content: space-between;
          padding: 0.625rem 1.25rem;
          font-size: 0.875rem;
          color: hsl(var(--foreground));
        }
        .row-total {
          border-top: 2px solid hsl(var(--border));
          font-weight: 700;
          font-size: 1rem;
        }

        .ic-card {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          margin-top: 1rem;
        }
        .ic-eligible { border: 1px solid hsl(var(--success) / 0.3); background: hsl(var(--success) / 0.03); }
        .ic-ineligible { border: 1px solid hsl(var(--warning) / 0.3); background: hsl(var(--warning) / 0.03); }
        .ic-icon { flex-shrink: 0; margin-top: 0.125rem; }
        .ic-label { font-weight: 600; font-size: 0.875rem; color: hsl(var(--foreground)); }

        .accepted-state { margin-top: 1.5rem; }
        .accepted-label {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(var(--success));
          margin: 0 0 0.75rem;
        }
        .btn-primary {
          padding: 0.625rem 1.5rem;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border: none;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
          text-decoration: none;
        }
        .btn-primary:hover { opacity: 0.9; }
      `}</style>
    </div>
  );
}
