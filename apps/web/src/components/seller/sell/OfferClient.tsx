"use client";

import { useOfferDetail } from "@/hooks/use-seller";
import { formatINR, formatDate } from "@/lib/format";
import { IC_REASON_COPY } from "@certibuy/contracts";
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

  if (isLoading) return <p>Loading offer...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const offer = data as unknown as OfferData;
  if (!offer) return <p>No offer found.</p>;

  const alreadyAccepted = offer.offerStatus === "accepted" || offer.chosenOption;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        Your offer for {offer.model.brand} {offer.model.name}
      </h2>
      <p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "1rem" }}>
        Band: {offer.band.join("–")} · Expires {formatDate(offer.expiresAt)}
      </p>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: "0.5rem", overflow: "hidden" }}>
        <Row label="Market price" value={formatINR(offer.marketPrice)} />
        <Row label="Inspection fee" value={`−${formatINR(offer.inspectionFee)}`} />
        <Row label={`Risk deduction (${offer.riskPct}%)`} value={`−${formatINR(offer.riskDeduction)}`} />
        <div style={{ borderTop: "2px solid #e5e7eb" }}>
          <Row label="Sell For More (guaranteed)" value={formatINR(offer.guaranteedPrice)} bold />
        </div>
      </div>

      {offer.icEligible ? (
        <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", border: "1px solid #bbf7d0", borderRadius: "0.5rem", backgroundColor: "#f0fdf4" }}>
          <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>
            Instant Cash available: {formatINR(offer.instantCashAmount)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#166534", marginTop: "0.25rem" }}>
            Get paid immediately at the hub. 50% upfront, rest when it sells or on day 21.
          </div>
        </div>
      ) : (
        <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", border: "1px solid #fde68a", borderRadius: "0.5rem", backgroundColor: "#fefce8" }}>
          <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>Instant Cash not available</div>
          <div style={{ fontSize: "0.75rem", color: "#854d0e", marginTop: "0.25rem" }}>
            {offer.icReason ? IC_REASON_COPY[offer.icReason] ?? offer.icReason : ""}
          </div>
        </div>
      )}

      {alreadyAccepted ? (
        <div style={{ marginTop: "1.5rem" }}>
          <p style={{ fontSize: "0.875rem", color: "#16a34a", fontWeight: 500 }}>
            Offer accepted ({offer.chosenOption === "instant_cash" ? "Instant Cash" : "Sell For More"}).
          </p>
          <Link
            href={`/seller/sell/${submissionId}/hub`}
            style={{ display: "inline-block", marginTop: "0.5rem", padding: "0.5rem 1.25rem", backgroundColor: "#2563eb", color: "#fff", borderRadius: "0.375rem", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}
          >
            Book inspection
          </Link>
        </div>
      ) : (
        <Link
          href={`/seller/sell/${submissionId}/confirm`}
          style={{ display: "inline-block", marginTop: "1.5rem", padding: "0.5rem 1.25rem", backgroundColor: "#2563eb", color: "#fff", borderRadius: "0.375rem", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500 }}
        >
          Accept offer
        </Link>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: bold ? 600 : 400 }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
