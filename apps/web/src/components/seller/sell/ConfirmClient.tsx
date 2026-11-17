"use client";

import { useOfferDetail, useAcceptOffer } from "@/hooks/use-seller";
import { formatINR } from "@/lib/format";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

  if (isLoading) return <p>Loading...</p>;
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
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>
        Accept your offer
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem" }}>
        <button
          onClick={() => setOption("sell_for_more")}
          style={{
            padding: "0.75rem 1rem",
            border: option === "sell_for_more" ? "2px solid #2563eb" : "1px solid #d1d5db",
            borderRadius: "0.5rem",
            backgroundColor: option === "sell_for_more" ? "#eff6ff" : "#fff",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div style={{ fontWeight: 500 }}>Sell For More — {formatINR(offer.guaranteedPrice)}</div>
          <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
            50% advance now, rest when it sells or on day 21. Guaranteed price.
          </div>
        </button>

        {offer.icEligible && (
          <button
            onClick={() => setOption("instant_cash")}
            style={{
              padding: "0.75rem 1rem",
              border: option === "instant_cash" ? "2px solid #2563eb" : "1px solid #d1d5db",
              borderRadius: "0.5rem",
              backgroundColor: option === "instant_cash" ? "#eff6ff" : "#fff",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ fontWeight: 500 }}>Instant Cash — {formatINR(offer.instantCashAmount)}</div>
            <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
              Full payout at the hub. Lower price includes a risk deduction.
            </div>
          </button>
        )}
      </div>

      <label style={{ display: "flex", alignItems: "start", gap: "0.5rem", fontSize: "0.8125rem", cursor: "pointer" }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: "0.125rem" }} />
        <span>
          I confirm the device details are accurate and I consent to the inspection and payout terms.
        </span>
      </label>

      {error && <p style={{ color: "#991b1b", fontSize: "0.875rem", marginTop: "0.75rem" }}>{error}</p>}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem" }}>
        <button onClick={() => router.back()} style={{ padding: "0.5rem 1.25rem", backgroundColor: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.875rem" }}>
          Back
        </button>
        <button
          onClick={handleAccept}
          disabled={accept.isPending || !option || !consent}
          style={{
            padding: "0.5rem 1.25rem",
            backgroundColor: option && consent ? "#2563eb" : "#9ca3af",
            color: "#fff",
            border: "none",
            borderRadius: "0.375rem",
            cursor: option && consent ? "pointer" : "not-allowed",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          {accept.isPending ? "Accepting..." : "Accept and book"}
        </button>
      </div>
    </div>
  );
}
