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

function gradeLabel(g: string) {
  if (g === "A") return "Like new";
  if (g === "B") return "Light signs of use";
  if (g === "C") return "Visible wear";
  return "Refurbished";
}

export function ListingDetailClient({ listingId }: { listingId: string }) {
  const { data, isLoading, error } = useListingDetail(listingId);

  if (isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading listing...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))", padding: "1rem" }}>{(error as Error).message}</p>;
  if (!data) return <p>Listing not found.</p>;

  const d = data as unknown as ListingData;
  const checklist = d.inspection?.checklist ? Object.entries(d.inspection.checklist as Record<string, string>) : [];
  const passCount = checklist.filter(([, v]) => v === "pass").length;
  const reportId = d.listingId.slice(0, 8).toUpperCase();

  return (
    <div className="detail-page">
      {/* Breadcrumb + title row */}
      <Link href="/shop/browse" className="detail-back" style={{ fontSize: "0.8125rem", color: "hsl(var(--muted))", textDecoration: "none" }}>← All devices</Link>
      <div className="detail-title-row">
        <h1 className="detail-title">{d.brand} {d.model}</h1>
        <span className="detail-title-storage">{d.storage}</span>
        <GradeChip grade={d.grade} size="md" />
        <span className="detail-title-hub">{d.hubName}, {d.hubCity}</span>
      </div>

      {/* Main layout: content + sidebar */}
      <div className="detail-layout">
        {/* Left column */}
        <div className="detail-main">
          {/* Photo hero */}
          <div className="photo-hero surface">
            <div className="photo-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              Photo of this exact unit
            </div>
            <div className="photo-grid">
              <DeviceImage imageUrl={d.imageUrl} brand={d.brand} model={d.model} category={d.category} size="lg" />
            </div>
          </div>

          {/* What you get */}
          <div className="wyg-card surface">
            <h2 className="section-heading">What you get</h2>
            <div className="wyg-grid">
              {d.inspection && (
                <div className="wyg-item">
                  <span className="wyg-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="6" width="18" height="12" rx="2"/><path d="M23 13v-2a2 2 0 0 0-2-2h-1"/></svg>
                    BATTERY HEALTH
                  </span>
                  <span className="wyg-value">{d.inspection.batteryHealth}%</span>
                  <div className="battery-bar">
                    <div className="battery-fill" style={{ width: `${d.inspection.batteryHealth}%`, background: d.inspection.batteryHealth >= 80 ? "hsl(var(--success))" : "hsl(var(--warning))" }} />
                  </div>
                  <span className="meta">Measured by the technician on the day it was graded.</span>
                </div>
              )}
              <div className="wyg-item">
                <span className="wyg-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  WARRANTY
                </span>
                <span className="wyg-value-serif">
                  {d.warrantyMonths > 0 ? `${d.warrantyMonths}-month warranty` : "No warranty"}
                </span>
                {d.warrantyMonths > 0 && <span className="meta">Add a second year at checkout for 5% of the price.</span>}
              </div>
            </div>

            {/* Returns policy */}
            <div className="returns-section">
              <span className="wyg-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                RETURNS, PRICED UP FRONT
              </span>
              <div className="returns-list">
                <p><strong>Not as graded</strong> — full refund, nothing deducted.</p>
                <p><strong>Dead on arrival</strong> — refund or replacement, our call on the courier.</p>
                <p><strong>Changed your mind</strong> — ₹500 change-of-mind fee, plus ₹300 return logistics.</p>
              </div>
              <p className="meta">Within {d.returnWindowDays} days of delivery, with the device as it was shipped.</p>
            </div>

            {/* Escrow */}
            <div className="escrow-note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span><strong>Escrow.</strong> Your payment is held until the {d.returnWindowDays}-day window closes. CertiBuy is paid only once you&apos;ve had the device and kept it.</span>
            </div>
          </div>

          {/* Inspection report */}
          {d.inspection && (
            <div className="inspection-card surface">
              <div className="inspection-header">
                <div>
                  <h2 className="section-heading" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    Inspection report
                  </h2>
                  <p className="meta">Report {reportId}</p>
                </div>
                <div className="inspection-meta">
                  <span>{d.hubName}, {d.hubCity}</span>
                </div>
              </div>

              <div className="checklist-header">
                <span className="wyg-label">CHECKLIST</span>
                <span className="meta">{passCount} of {checklist.length} pass</span>
              </div>
              <div className="checklist-grid">
                {checklist.map(([k, v]) => (
                  <div key={k} className="checklist-item">
                    <span className="checklist-name">{k.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())}</span>
                    <span className={`checklist-result ${v === "pass" ? "result-pass" : "result-fail"}`}>
                      {v === "pass" ? "✓" : "✗"} {v === "pass" ? "Pass" : "Fail"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Footer: IMEI, custody tag, colour */}
              <div className="inspection-footer">
                <div className="inspection-footer-item">
                  <span className="meta">IMEI VERIFIED</span>
                  <span>•••• {d.listingId.slice(-4)}</span>
                </div>
                <div className="inspection-footer-item">
                  <span className="meta">CUSTODY TAG</span>
                  <span>CB-{d.listingId.slice(0, 5).toUpperCase()}</span>
                </div>
                {d.device.colour && (
                  <div className="inspection-footer-item">
                    <span className="meta">COLOUR</span>
                    <span>{d.device.colour}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="detail-sidebar">
          <div className="sidebar-card surface">
            <div className="sidebar-top">
              <GradeChip grade={d.grade} size="md" />
              <span className="sidebar-grade-label">{gradeLabel(d.grade)}</span>
            </div>
            <div className="sidebar-price">{formatINR(d.currentPrice)}</div>
            {d.warrantyMonths > 0 && (
              <p className="meta" style={{ marginBottom: "0.75rem" }}>
                {d.warrantyMonths}-month warranty · second year for {formatINR(Math.round(d.currentPrice * 0.05))} at checkout.
              </p>
            )}

            {d.status === "active" ? (
              <Link href={`/shop/checkout/${d.listingId}`} className="buy-btn" style={{ marginBottom: "1rem" }}>
                Buy now, paid into escrow →
              </Link>
            ) : (
              <p className="unavailable-msg">This listing is no longer available.</p>
            )}

            <div className="sidebar-trust">
              <div className="trust-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span>Money is held in escrow until the return window closes.</span>
              </div>
              <div className="trust-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><path d="M16 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/></svg>
                <span>Delivered by {new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })} — already in our hands.</span>
              </div>
              <div className="trust-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                <span>Seven days to return it, with any deduction shown first.</span>
              </div>
              {d.warrantyMonths > 0 && (
                <div className="trust-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>Warranty is serviced by CertiBuy.</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .detail-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
        }
        .detail-title-row {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          flex-wrap: wrap;
          margin: 0.5rem 0 1rem;
        }
        .detail-title {
          font-size: 1.375rem;
          font-weight: 700;
          margin: 0;
          color: hsl(var(--foreground));
        }
        .detail-title-storage {
          font-size: 0.875rem;
          color: hsl(var(--muted));
        }
        .detail-title-hub {
          font-size: 0.8125rem;
          color: hsl(var(--muted));
        }

        /* Layout */
        .detail-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.5rem;
          align-items: start;
        }
        .detail-main {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Photo hero */
        .photo-hero {
          position: relative;
          padding: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 320px;
          background: hsl(var(--card));
        }
        .photo-badge {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          color: hsl(var(--muted));
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
        }
        .photo-grid {
          max-width: 320px;
        }

        /* What you get */
        .wyg-card { padding: 1.5rem; }
        .section-heading {
          font-size: 1rem;
          font-weight: 700;
          margin: 0 0 1rem;
          color: hsl(var(--foreground));
        }
        .wyg-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid hsl(var(--border));
          margin-bottom: 1.25rem;
        }
        .wyg-item { display: flex; flex-direction: column; gap: 0.25rem; }
        .wyg-label {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: hsl(var(--muted));
        }
        .wyg-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: hsl(var(--foreground));
          line-height: 1.2;
        }
        .wyg-value-serif {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 1.5rem;
          color: hsl(var(--foreground));
          line-height: 1.3;
        }
        .battery-bar {
          height: 6px;
          background: hsl(var(--border));
          border-radius: 3px;
          overflow: hidden;
          margin-top: 0.25rem;
        }
        .battery-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s;
        }
        .returns-section {
          padding-bottom: 1.25rem;
          border-bottom: 1px solid hsl(var(--border));
          margin-bottom: 1.25rem;
        }
        .returns-list {
          margin: 0.625rem 0 0.5rem;
        }
        .returns-list p {
          margin: 0.375rem 0;
          font-size: 0.875rem;
          color: hsl(var(--foreground));
          line-height: 1.5;
        }
        .escrow-note {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: hsl(var(--muted));
          line-height: 1.5;
          padding: 0.75rem;
          background: hsl(var(--secondary));
          border-radius: 0.75rem;
        }
        .escrow-note svg { flex-shrink: 0; margin-top: 0.125rem; }

        /* Inspection */
        .inspection-card { padding: 1.5rem; }
        .inspection-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
        }
        .inspection-meta {
          text-align: right;
          font-size: 0.8125rem;
          color: hsl(var(--muted));
        }
        .checklist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .checklist-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
        }
        .checklist-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          font-size: 0.8125rem;
        }
        .checklist-item:nth-child(odd) { padding-right: 1rem; }
        .checklist-item:nth-child(even) { padding-left: 1rem; }
        .checklist-name { color: hsl(var(--foreground)); }
        .result-pass { color: hsl(var(--success)); font-weight: 500; }
        .result-fail { color: hsl(var(--destructive)); font-weight: 500; }
        .inspection-footer {
          display: flex;
          gap: 2rem;
          margin-top: 1.25rem;
          padding-top: 1.25rem;
          border-top: 1px solid hsl(var(--border));
        }
        .inspection-footer-item {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          font-size: 0.875rem;
          color: hsl(var(--foreground));
        }

        /* Sidebar */
        .detail-sidebar { position: sticky; top: 112px; }
        .sidebar-card { padding: 1.25rem; }
        .sidebar-top {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .sidebar-grade-label {
          font-size: 0.8125rem;
          color: hsl(var(--muted));
        }
        .sidebar-price {
          font-size: 2rem;
          font-weight: 700;
          color: hsl(var(--foreground));
          margin-bottom: 0.375rem;
          line-height: 1.2;
        }
        .unavailable-msg {
          text-align: center;
          color: hsl(var(--muted));
          font-size: 0.875rem;
          padding: 0.75rem;
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          margin-bottom: 1rem;
        }
        .sidebar-trust {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .trust-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: hsl(var(--muted));
          line-height: 1.4;
        }
        .trust-item svg { flex-shrink: 0; margin-top: 0.125rem; }

        @media (max-width: 768px) {
          .detail-layout {
            grid-template-columns: 1fr;
          }
          .detail-sidebar {
            position: static;
            order: -1;
          }
          .wyg-grid { grid-template-columns: 1fr; }
          .checklist-grid { grid-template-columns: 1fr; }
          .checklist-item:nth-child(odd) { padding-right: 0; }
          .checklist-item:nth-child(even) { padding-left: 0; }
          .inspection-footer { flex-wrap: wrap; gap: 1rem; }
        }
      `}</style>
    </div>
  );
}
