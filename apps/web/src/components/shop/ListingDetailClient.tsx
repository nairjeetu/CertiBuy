"use client";

import { useListingDetail } from "@/hooks/use-shop";
import { GradeChip } from "../ui/GradeChip";
import { formatINR } from "@/lib/format";
import Link from "next/link";

interface GradePrice { grade: string; price: number; listingId: string }

export function ListingDetailClient({ listingId }: { listingId: string }) {
  const { data, isLoading, error } = useListingDetail(listingId);

  if (isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading listing...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))" }}>{(error as Error).message}</p>;
  if (!data) return <p>Listing not found.</p>;

  const d = data as {
    listingId: string; brand: string; model: string; storage: string; category: string;
    grade: string; currentPrice: number; basePrice: number; warrantyMonths: number;
    hubName: string; hubCity: string; status: string; gradeStrip: GradePrice[];
    inspection: { checklist: Record<string, string>; batteryHealth: number; cosmeticGrade: string; computedGrade: string } | null;
    returnWindowDays: number;
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <Link href="/shop/browse" style={{ fontSize: "0.875rem", color: "hsl(var(--primary))", textDecoration: "none" }}>
        Back to browse
      </Link>

      <div style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0, color: "hsl(var(--foreground))" }}>{d.brand} {d.model}</h2>
        <p style={{ margin: "0.25rem 0", fontSize: "0.875rem", color: "hsl(var(--muted))" }}>{d.storage} · {d.category}</p>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
          <GradeChip grade={d.grade} size="md" />
          <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>{formatINR(d.currentPrice)}</span>
        </div>
      </div>

      {d.gradeStrip.length > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {d.gradeStrip.map((g) => {
            const isCurrent = g.listingId === d.listingId;
            const tile = (
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  border: isCurrent ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  textAlign: "center",
                  minWidth: 70,
                  background: isCurrent ? "hsl(var(--primary) / 0.05)" : "hsl(var(--card))",
                }}
              >
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "hsl(var(--foreground))" }}>Grade {g.grade}</span>
                <br />
                <span style={{ fontSize: "0.875rem", color: "hsl(var(--foreground))" }}>{formatINR(g.price)}</span>
              </div>
            );
            if (isCurrent) return <span key={g.listingId}>{tile}</span>;
            return (
              <Link key={g.listingId} href={`/shop/${g.listingId}`} style={{ textDecoration: "none", color: "inherit" }}>
                {tile}
              </Link>
            );
          })}
        </div>
      )}

      <div className="surface" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.5rem" }}>Details</h3>
        <div style={{ fontSize: "0.875rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
          <span style={{ color: "hsl(var(--muted))" }}>Hub</span><span>{d.hubName}, {d.hubCity}</span>
          <span style={{ color: "hsl(var(--muted))" }}>Warranty</span><span>{d.warrantyMonths > 0 ? `${d.warrantyMonths} months` : "None"}</span>
          <span style={{ color: "hsl(var(--muted))" }}>Return window</span><span>{d.returnWindowDays} days</span>
        </div>
      </div>

      {d.inspection && (
        <div className="surface" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.5rem" }}>Inspection summary</h3>
          <div style={{ fontSize: "0.875rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.375rem" }}>
            <span style={{ color: "hsl(var(--muted))" }}>Battery health</span><span>{d.inspection.batteryHealth}%</span>
            <span style={{ color: "hsl(var(--muted))" }}>Cosmetic grade</span><span>{d.inspection.cosmeticGrade}</span>
            {Object.entries(d.inspection.checklist as Record<string, string>).map(([k, v]) => (
              <span key={k} style={{ display: "contents" }}>
                <span style={{ color: "hsl(var(--muted))", textTransform: "capitalize" }}>{k.replace(/_/g, " ")}</span>
                <span style={{ color: v === "pass" ? "hsl(var(--success))" : "hsl(var(--destructive))" }}>{v}</span>
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
            backgroundColor: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
            borderRadius: "9999px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "1rem",
          }}
        >
          Buy now
        </Link>
      ) : (
        <p style={{ textAlign: "center", color: "hsl(var(--muted))", fontSize: "0.875rem" }}>
          This listing is no longer available.
        </p>
      )}
    </div>
  );
}
