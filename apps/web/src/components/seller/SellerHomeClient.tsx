"use client";

import { useSellerHome } from "@/hooks/use-seller";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatINR } from "@/lib/format";
import Link from "next/link";

interface Deal {
  id: string;
  status: string;
  statusLabel: string;
  statusTone: string;
  model: { brand: string; name: string; storage: string };
  offer: { guaranteedPrice: number; icEligible: boolean } | null;
  chosenOption: string | null;
  nextAction: string;
}

export function SellerHomeClient() {
  const { data, isLoading, error } = useSellerHome();

  if (isLoading) return <p>Loading your deals...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const deals = (data?.deals ?? []) as Deal[];

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Sell your device</h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
            Get an instant quote. Two payout options: Instant Cash or Sell For More.
          </p>
        </div>
        <Link
          href="/seller/sell"
          style={{
            display: "inline-block",
            padding: "0.5rem 1rem",
            backgroundColor: "#2563eb",
            color: "#fff",
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Start selling
        </Link>
      </div>

      {deals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#6b7280" }}>
          <p style={{ fontSize: "1rem" }}>No deals yet.</p>
          <p style={{ fontSize: "0.875rem" }}>Start a submission to get an offer for your device.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {deals.map((deal) => (
            <Link
              key={deal.id}
              href={deal.status === "draft" || deal.status === "graded" || deal.status === "offer_accepted"
                ? `/seller/sell/${deal.id}`
                : `/seller/deals/${deal.id}`}
              style={{
                display: "block",
                padding: "0.75rem 1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <div style={{ fontWeight: 500 }}>
                    {deal.model.brand} {deal.model.name} {deal.model.storage}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                    {deal.nextAction}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <StatusChip label={deal.statusLabel} tone={deal.statusTone} />
                  {deal.offer && (
                    <div style={{ fontSize: "0.875rem", fontWeight: 500, marginTop: "0.25rem" }}>
                      {formatINR(deal.offer.guaranteedPrice)}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
