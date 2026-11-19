"use client";

import { useListingDetail } from "@/hooks/use-shop";
import { GradeChip } from "../ui/GradeChip";
import { DeviceImage } from "./DeviceImage";
import { formatINR } from "@/lib/format";
import Link from "next/link";

interface GradePrice { grade: string; price: number; listingId: string }

interface ListingData {
  listingId: string; brand: string; model: string; storage: string; category: string;
  imageUrl: string; grade: string; currentPrice: number; basePrice: number;
  warrantyMonths: number; hubName: string; hubCity: string; status: string;
  gradeStrip: GradePrice[];
  device: {
    colour: string; ageMonths: number; repaired: string;
    waterExposure: boolean; billBox: string; warrantyStatus: string;
  };
  specs: { originalPrice: number; launchDate: string | null };
  photos: string[];
  inspection: {
    checklist: Record<string, string>; batteryHealth: number;
    cosmeticGrade: string; computedGrade: string; photos: string[];
  } | null;
  returnWindowDays: number;
}

function InfoRow({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
      <span style={{ color: "hsl(var(--muted))", fontSize: "0.875rem" }}>{label}</span>
      <span style={{ fontSize: "0.875rem", fontWeight: 500, color: good !== undefined ? (good ? "hsl(var(--success))" : "hsl(var(--warning))") : "hsl(var(--foreground))" }}>{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, margin: "0 0 0.75rem", color: "hsl(var(--foreground))" }}>{children}</h3>;
}

function billBoxLabel(v: string) {
  if (v === "both") return "Bill and box available";
  if (v === "bill_only") return "Bill available, no box";
  if (v === "box_only") return "Box available, no bill";
  return "No bill or box";
}

function warrantyLabel(v: string) {
  if (v === "active") return "Active";
  if (v === "expired") return "Expired";
  return "Unknown";
}

function repairLabel(v: string) {
  if (v === "no") return "No repairs";
  if (v === "screen") return "Screen replaced";
  if (v === "battery") return "Battery replaced";
  if (v === "other") return "Other repair";
  return v;
}

export function ListingDetailClient({ listingId }: { listingId: string }) {
  const { data, isLoading, error } = useListingDetail(listingId);

  if (isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading listing...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))", padding: "1rem" }}>{(error as Error).message}</p>;
  if (!data) return <p>Listing not found.</p>;

  const d = data as unknown as ListingData;
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <Link href="/shop/browse" style={{ fontSize: "0.8125rem", color: "hsl(var(--primary))", textDecoration: "none" }}>
        ← Back to browse
      </Link>

      {/* Hero: image + key info side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1rem", alignItems: "start" }}>
        {/* Left: device image */}
        <div className="surface" style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", position: "relative" }}>
          <DeviceImage imageUrl={d.imageUrl} brand={d.brand} model={d.model} category={d.category} size="lg" />
          <div style={{ position: "absolute", top: "0.5rem", left: "0.5rem" }}>
            <GradeChip grade={d.grade} size="md" />
          </div>
        </div>

        {/* Right: key info */}
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, margin: 0, color: "hsl(var(--foreground))", lineHeight: 1.3 }}>
            {d.brand} {d.model}
          </h1>
          <p style={{ margin: "0.25rem 0 0.75rem", fontSize: "0.875rem", color: "hsl(var(--muted))" }}>
            {d.storage} · {d.category}{d.device.colour ? ` · ${d.device.colour}` : ""}
          </p>

          <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "hsl(var(--foreground))" }}>{formatINR(d.currentPrice)}</span>
            {d.specs.originalPrice > 0 && (
              <span style={{ fontSize: "0.8125rem", color: "hsl(var(--muted))", textDecoration: "line-through" }}>
                {formatINR(d.specs.originalPrice)}
              </span>
            )}
          </div>

          {d.specs.originalPrice > 0 && (
            <p style={{ margin: "0 0 1rem", fontSize: "0.8125rem", color: "hsl(var(--success))", fontWeight: 500 }}>
              Save {formatINR(d.specs.originalPrice - d.currentPrice)} ({Math.round((1 - d.currentPrice / d.specs.originalPrice) * 100)}% off)
            </p>
          )}

          {/* Grade strip */}
          {d.gradeStrip.length > 1 && (
            <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              {d.gradeStrip.map((g) => {
                const isCurrent = g.listingId === d.listingId;
                const tile = (
                  <div style={{
                    padding: "0.375rem 0.625rem",
                    border: isCurrent ? "2px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    textAlign: "center",
                    minWidth: 60,
                    background: isCurrent ? "hsl(var(--primary) / 0.05)" : "hsl(var(--card))",
                    fontSize: "0.75rem",
                  }}>
                    <div style={{ fontWeight: 600 }}>Grade {g.grade}</div>
                    <div>{formatINR(g.price)}</div>
                  </div>
                );
                if (isCurrent) return <span key={g.listingId}>{tile}</span>;
                return <Link key={g.listingId} href={`/shop/${g.listingId}`} style={{ textDecoration: "none", color: "inherit" }}>{tile}</Link>;
              })}
            </div>
          )}

          {/* Trust badges */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            {d.warrantyMonths > 0 && (
              <span style={{ fontSize: "0.75rem", fontWeight: 500, padding: "0.25rem 0.625rem", borderRadius: "9999px", background: "hsl(var(--success) / 0.1)", color: "hsl(var(--success))" }}>
                {d.warrantyMonths} mo warranty
              </span>
            )}
            <span style={{ fontSize: "0.75rem", fontWeight: 500, padding: "0.25rem 0.625rem", borderRadius: "9999px", background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>
              {d.returnWindowDays}-day returns
            </span>
            <span style={{ fontSize: "0.75rem", fontWeight: 500, padding: "0.25rem 0.625rem", borderRadius: "9999px", background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}>
              Escrow protected
            </span>
          </div>

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
            <p style={{ textAlign: "center", color: "hsl(var(--muted))", fontSize: "0.875rem", padding: "0.75rem", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)" }}>
              This listing is no longer available
            </p>
          )}
        </div>
      </div>

      {/* Sections below */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.5rem" }}>
        {/* Configuration */}
        <div className="surface" style={{ padding: "1rem" }}>
          <SectionTitle>Configuration</SectionTitle>
          <InfoRow label="Storage" value={d.storage} />
          <InfoRow label="Colour" value={d.device.colour || "Not specified"} />
          <InfoRow label="Category" value={d.category.charAt(0).toUpperCase() + d.category.slice(1)} />
          {d.specs.launchDate && (
            <InfoRow label="Launched" value={new Date(d.specs.launchDate).toLocaleDateString("en-IN", { year: "numeric", month: "short" })} />
          )}
          {d.specs.originalPrice > 0 && (
            <InfoRow label="Launch price" value={formatINR(d.specs.originalPrice)} />
          )}
        </div>

        {/* Device condition */}
        <div className="surface" style={{ padding: "1rem" }}>
          <SectionTitle>Device condition</SectionTitle>
          <InfoRow label="Grade" value={`Grade ${d.grade}`} />
          <InfoRow label="Device age" value={d.device.ageMonths > 0 ? `${d.device.ageMonths} months` : "Not specified"} />
          <InfoRow label="Repair history" value={repairLabel(d.device.repaired)} good={d.device.repaired === "no"} />
          <InfoRow label="Water exposure" value={d.device.waterExposure ? "Yes" : "No"} good={!d.device.waterExposure} />
          <InfoRow label="Accessories" value={billBoxLabel(d.device.billBox)} />
          <InfoRow label="OEM warranty" value={warrantyLabel(d.device.warrantyStatus)} good={d.device.warrantyStatus === "active"} />
        </div>
      </div>

      {/* Inspection report */}
      {d.inspection && (
        <div className="surface" style={{ padding: "1rem", marginTop: "1rem" }}>
          <SectionTitle>Inspection report</SectionTitle>
          <p className="meta" style={{ margin: "-0.5rem 0 0.75rem" }}>Verified by a CertiBuy technician at the hub</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0" }}>
            <InfoRow label="Battery health" value={`${d.inspection.batteryHealth}%`} good={d.inspection.batteryHealth >= 80} />
            <InfoRow label="Cosmetic grade" value={d.inspection.cosmeticGrade} />
            {Object.entries(d.inspection.checklist as Record<string, string>).map(([k, v]) => (
              <InfoRow
                key={k}
                label={k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}
                value={v === "pass" ? "Pass" : v === "fail" ? "Fail" : v}
                good={v === "pass"}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hub details */}
      <div className="surface" style={{ padding: "1rem", marginTop: "1rem" }}>
        <SectionTitle>Purchase details</SectionTitle>
        <InfoRow label="Inspected at" value={`${d.hubName}, ${d.hubCity}`} />
        <InfoRow label="Warranty" value={d.warrantyMonths > 0 ? `${d.warrantyMonths} months (CertiBuy)` : "None"} />
        <InfoRow label="Return window" value={`${d.returnWindowDays} days`} />
        <InfoRow label="Payment" value="Escrow — released after return window" />
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
