"use client";

import { useListingDetail } from "@/hooks/use-shop";
import { GradeBadge } from "./GradeBadge";
import { formatINR } from "@/lib/format";
import Link from "next/link";

interface GradePrice { grade: string; price: number }

export function ListingDetailClient({ listingId }: { listingId: string }) {
  const { data, isLoading, error } = useListingDetail(listingId);

  if (isLoading) return <p>Loading listing...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;
  if (!data) return <p>Listing not found.</p>;

  const d = data as {
    listingId: string; brand: string; model: string; storage: string; category: string;
    grade: string; currentPrice: number; basePrice: number; warrantyMonths: number;
    hubName: string; hubCity: string; status: string; gradeStrip: GradePrice[];
    inspection: { checklist: Record<string, string>; batteryHealth: number; cosmeticGrade: string; computedGrade: string } | null;
    returnWindowDays: number;
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <Link href="/shop/browse" style={{ fontSize: "0.875rem", color: "#2563eb", textDecoration: "none" }}>
        Back to browse
      </Link>

      <div style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>{d.brand} {d.model}</h2>
        <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "#6b7280" }}>{d.storage} · {d.category}</p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
          <GradeBadge grade={d.grade} />
          <span style={{ fontSize: "1.5rem", fontWeight: 700 }}>{formatINR(d.currentPrice)}</span>
        </div>
      </div>

      {d.gradeStrip.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {d.gradeStrip.map((g) => (
            <div
              key={g.grade}
              style={{
                padding: "0.5rem 0.75rem",
                border: g.grade === d.grade ? "2px solid #2563eb" : "1px solid #e5e7eb",
                borderRadius: 6,
                textAlign: "center",
                minWidth: 70,
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Grade {g.grade}</span>
              <br />
              <span style={{ fontSize: "0.875rem" }}>{formatINR(g.price)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.5rem" }}>Details</h3>
        <div style={{ fontSize: "0.875rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
          <span style={{ color: "#6b7280" }}>Hub</span><span>{d.hubName}, {d.hubCity}</span>
          <span style={{ color: "#6b7280" }}>Warranty</span><span>{d.warrantyMonths > 0 ? `${d.warrantyMonths} months` : "None"}</span>
          <span style={{ color: "#6b7280" }}>Return window</span><span>{d.returnWindowDays} days</span>
        </div>
      </div>

      {d.inspection && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "1rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.5rem" }}>Inspection summary</h3>
          <div style={{ fontSize: "0.875rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
            <span style={{ color: "#6b7280" }}>Battery health</span><span>{d.inspection.batteryHealth}%</span>
            <span style={{ color: "#6b7280" }}>Cosmetic grade</span><span>{d.inspection.cosmeticGrade}</span>
            {Object.entries(d.inspection.checklist as Record<string, string>).map(([k, v]) => (
              <span key={k} style={{ display: "contents" }}>
                <span style={{ color: "#6b7280", textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</span>
                <span style={{ color: v === "pass" ? "#166534" : "#991b1b" }}>{v}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {d.status === "active" ? (
        <Link
          href={`/shop/checkout/${d.listingId}`}
          style={{
            display: "block",
            textAlign: "center",
            padding: "0.75rem",
            backgroundColor: "#2563eb",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Buy now
        </Link>
      ) : (
        <p style={{ textAlign: "center", color: "#6b7280", fontSize: "0.875rem" }}>
          This listing is no longer available.
        </p>
      )}
    </div>
  );
}
