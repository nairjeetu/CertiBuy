"use client";

import { useOfferDetail, useAcceptOffer } from "@/hooks/use-seller";
import { formatINR } from "@/lib/format";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StepRail } from "./StepRail";

interface OfferData {
  guaranteedPrice: number;
  instantCashAmount: number;
  icEligible: boolean;
  model: { brand: string; name: string; storage: string };
}

export function ConfirmClient({ submissionId }: { submissionId: string }) {
  const { data, isLoading } = useOfferDetail(submissionId);
  const accept = useAcceptOffer();
  const router = useRouter();
  const [option, setOption] = useState<"instant_cash" | "sell_for_more" | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  if (isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading...</p>;
  const offer = data as unknown as OfferData | undefined;
  if (!offer) return <p>No offer found.</p>;

  async function handleAccept() {
    if (!option) { setError("Choose a payout option."); return; }
    if (!consent) { setError("Please give your consent to proceed."); return; }
    setError("");
    try {
      await accept.mutateAsync({ submissionId, option, consent: true });
      router.push(`/seller/sell/${submissionId}/hub`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="confirm-page">
      <StepRail current={7} />
      <h1 className="confirm-title">Accept your offer</h1>
      <p className="meta" style={{ marginBottom: "1.25rem" }}>{offer.model.brand} {offer.model.name} · {offer.model.storage}</p>

      <div className="option-list">
        <button
          onClick={() => setOption("sell_for_more")}
          className={`option-card surface ${option === "sell_for_more" ? "option-active" : ""}`}
        >
          <div className="option-header">
            <span className={`option-dot ${option === "sell_for_more" ? "dot-active" : ""}`} />
            <span className="option-name">Sell For More</span>
            <span className="option-price">{formatINR(offer.guaranteedPrice)}</span>
          </div>
          <p className="meta" style={{ margin: 0, paddingLeft: "1.75rem" }}>50% advance now, rest when it sells or on day 21. Guaranteed price.</p>
        </button>

        {offer.icEligible && (
          <button
            onClick={() => setOption("instant_cash")}
            className={`option-card surface ${option === "instant_cash" ? "option-active" : ""}`}
          >
            <div className="option-header">
              <span className={`option-dot ${option === "instant_cash" ? "dot-active" : ""}`} />
              <span className="option-name">Instant Cash</span>
              <span className="option-price">{formatINR(offer.instantCashAmount)}</span>
            </div>
            <p className="meta" style={{ margin: 0, paddingLeft: "1.75rem" }}>Full payout at the hub. Lower price includes a risk deduction.</p>
          </button>
        )}
      </div>

      <label className="consent-label">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="consent-check" />
        <span>I confirm the device details are accurate and I consent to the inspection and payout terms.</span>
      </label>

      {error && <p className="error-msg">{error}</p>}

      <div className="actions">
        <button onClick={() => router.back()} className="btn-secondary">← Back</button>
        <button
          onClick={handleAccept}
          disabled={accept.isPending || !option || !consent}
          className="btn-primary"
        >
          {accept.isPending ? "Accepting..." : "Accept and book →"}
        </button>
      </div>

      <style jsx>{`
        .confirm-page {
          max-width: 560px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
        }
        .confirm-title {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 1.5rem;
          font-weight: 400;
          margin: 0 0 0.25rem;
          color: hsl(var(--foreground));
        }

        .option-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }
        .option-card {
          padding: 1rem 1.25rem;
          cursor: pointer;
          text-align: left;
          width: 100%;
          border: none;
          transition: all 0.15s;
        }
        .option-active {
          outline: 2px solid hsl(var(--primary));
          outline-offset: -2px;
          background: hsl(var(--primary) / 0.04);
        }
        .option-card:hover:not(.option-active) { box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
        .option-header {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          margin-bottom: 0.375rem;
        }
        .option-dot {
          width: 16px; height: 16px;
          border-radius: 50%;
          border: 2px solid hsl(var(--border));
          flex-shrink: 0;
          transition: all 0.15s;
        }
        .dot-active {
          border-color: hsl(var(--primary));
          background: hsl(var(--primary));
          box-shadow: inset 0 0 0 3px hsl(var(--card));
        }
        .option-name { font-weight: 600; font-size: 0.9375rem; color: hsl(var(--foreground)); flex: 1; }
        .option-price { font-weight: 700; font-size: 1rem; color: hsl(var(--foreground)); }

        .consent-label {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          font-size: 0.8125rem;
          color: hsl(var(--foreground));
          cursor: pointer;
          line-height: 1.5;
        }
        .consent-check {
          width: 18px; height: 18px;
          margin-top: 0.125rem;
          accent-color: hsl(var(--primary));
          flex-shrink: 0;
        }

        .error-msg { color: hsl(var(--destructive)); font-size: 0.875rem; margin-top: 0.75rem; }

        .actions {
          display: flex;
          justify-content: space-between;
          margin-top: 1.5rem;
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
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.9; }
        .btn-primary:disabled { opacity: 0.5; cursor: default; }
        .btn-secondary {
          padding: 0.625rem 1.25rem;
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          border: 1px solid hsl(var(--border));
          border-radius: 9999px;
          font-size: 0.875rem;
          cursor: pointer;
        }
        .btn-secondary:hover { background: hsl(var(--secondary)); }
      `}</style>
    </div>
  );
}
