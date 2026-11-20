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

function checkLabel(key: string) {
  const map: Record<string, string> = {
    battery: "Battery",
    screen: "Screen & touch",
    speakers: "Speakers",
    microphone: "Microphone",
    cameras: "Cameras",
    charging: "Charging port",
    sensors: "Sensors",
    imei_blacklist: "IMEI clear",
    activation_lock: "Activation lock",
  };
  return map[key] ?? key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
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
      <Link href="/shop/browse" className="detail-back" style={{ fontSize: "0.8125rem", color: "hsl(var(--muted))", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
        All devices
      </Link>

      <div className="detail-title-row">
        <h1 className="detail-title">{d.brand} {d.model}</h1>
        <span className="detail-title-storage">{d.storage}</span>
        <GradeChip grade={d.grade} size="md" />
      </div>
      <p className="detail-subtitle">{gradeLabel(d.grade)} · {d.hubName}, {d.hubCity}</p>

      <div className="detail-layout">
        {/* ── Left column ── */}
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

            <div className="escrow-note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span><strong>Escrow.</strong> Your payment is held until the {d.returnWindowDays}-day window closes. CertiBuy is paid only once you&apos;ve had the device and kept it.</span>
            </div>
          </div>

          {/* ── Inspection Report ── */}
          {d.inspection && (
            <div className="inspection-card surface">
              <div className="inspection-header">
                <div className="inspection-header-left">
                  <div className="inspection-icon-wrap">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <div>
                    <h2 className="inspection-title">Inspection Report</h2>
                    <span className="meta">Report #{reportId} · {d.hubName}</span>
                  </div>
                </div>
                <div className="inspection-grade-box">
                  <span className="inspection-grade-label">GRADE</span>
                  <span className="inspection-grade-letter">{d.inspection.computedGrade}</span>
                </div>
              </div>

              {/* Checklist */}
              <div className="checklist-section">
                <div className="checklist-header">
                  <span className="checklist-title">Functional checks</span>
                  <span className="checklist-count">{passCount}/{checklist.length} pass</span>
                </div>
                <div className="checklist-grid">
                  {checklist.map(([k, v]) => (
                    <div key={k} className={`checklist-item ${v === "pass" ? "item-pass" : "item-fail"}`}>
                      <span className="checklist-icon">
                        {v === "pass" ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--success))" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--destructive))" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        )}
                      </span>
                      <span className="checklist-name">{checkLabel(k)}</span>
                      <span className={`checklist-result ${v === "pass" ? "result-pass" : "result-fail"}`}>
                        {v === "pass" ? "Pass" : "Fail"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Battery detail */}
              <div className="battery-section">
                <div className="battery-detail-header">
                  <span className="battery-detail-label">Battery health</span>
                  <span className="battery-detail-value">{d.inspection.batteryHealth}%</span>
                </div>
                <div className="battery-bar-lg">
                  <div className="battery-fill-lg" style={{
                    width: `${d.inspection.batteryHealth}%`,
                    background: d.inspection.batteryHealth >= 80 ? "hsl(var(--success))" : d.inspection.batteryHealth >= 60 ? "hsl(var(--warning))" : "hsl(var(--destructive))"
                  }} />
                </div>
                <span className="meta">
                  {d.inspection.batteryHealth >= 80 ? "Excellent — holds a full day of use." : d.inspection.batteryHealth >= 60 ? "Good — moderate daily use." : "Fair — may need replacement soon."}
                </span>
              </div>

              {/* Footer: IMEI, custody, colour */}
              <div className="inspection-footer">
                <div className="inspection-footer-item">
                  <span className="footer-label">IMEI VERIFIED</span>
                  <span className="footer-value">•••• {d.listingId.slice(-4)}</span>
                </div>
                <div className="inspection-footer-item">
                  <span className="footer-label">CUSTODY TAG</span>
                  <span className="footer-value">CB-{d.listingId.slice(0, 5).toUpperCase()}</span>
                </div>
                {d.device.colour && (
                  <div className="inspection-footer-item">
                    <span className="footer-label">COLOUR</span>
                    <span className="footer-value">{d.device.colour}</span>
                  </div>
                )}
                <div className="inspection-footer-item">
                  <span className="footer-label">COSMETIC GRADE</span>
                  <span className="footer-value">{d.inspection.cosmeticGrade}</span>
                </div>
              </div>
            </div>
          )}

          {/* Device specs */}
          <div className="specs-card surface">
            <h2 className="section-heading">Device details</h2>
            <div className="specs-grid">
              <div className="spec-row">
                <span className="spec-label">Brand</span>
                <span className="spec-value">{d.brand}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Model</span>
                <span className="spec-value">{d.model}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Storage</span>
                <span className="spec-value">{d.storage}</span>
              </div>
              {d.device.colour && (
                <div className="spec-row">
                  <span className="spec-label">Colour</span>
                  <span className="spec-value">{d.device.colour}</span>
                </div>
              )}
              {d.device.ageMonths > 0 && (
                <div className="spec-row">
                  <span className="spec-label">Age</span>
                  <span className="spec-value">{d.device.ageMonths} months</span>
                </div>
              )}
              {d.specs.originalPrice > 0 && (
                <div className="spec-row">
                  <span className="spec-label">Original price</span>
                  <span className="spec-value">{formatINR(d.specs.originalPrice)}</span>
                </div>
              )}
              <div className="spec-row">
                <span className="spec-label">Repair history</span>
                <span className="spec-value">{d.device.repaired === "no" ? "None reported" : d.device.repaired === "screen" ? "Screen replaced" : d.device.repaired === "battery" ? "Battery replaced" : "Other repair"}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Water exposure</span>
                <span className="spec-value">{d.device.waterExposure ? "Yes" : "None reported"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <aside className="detail-sidebar">
          <div className="sidebar-card surface">
            <div className="sidebar-top">
              <GradeChip grade={d.grade} size="md" />
              <span className="sidebar-grade-label">{gradeLabel(d.grade)}</span>
            </div>
            <div className="sidebar-price">{formatINR(d.currentPrice)}</div>
            {d.specs.originalPrice > 0 && (
              <p className="sidebar-original">
                <span className="original-strike">{formatINR(d.specs.originalPrice)}</span>
                <span className="save-pct">{Math.round((1 - d.currentPrice / d.specs.originalPrice) * 100)}% off</span>
              </p>
            )}
            {d.warrantyMonths > 0 && (
              <p className="meta" style={{ marginBottom: "0.75rem" }}>
                {d.warrantyMonths}-month warranty · extend to 2 years for {formatINR(Math.round(d.currentPrice * 0.05))}.
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--success))" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <div>
                  <span className="trust-title">Escrow protected</span>
                  <span className="trust-desc">Money held until return window closes.</span>
                </div>
              </div>
              <div className="trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--success))" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <div>
                  <span className="trust-title">Technician inspected</span>
                  <span className="trust-desc">Every check verified at the hub.</span>
                </div>
              </div>
              <div className="trust-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--success))" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                <div>
                  <span className="trust-title">{d.returnWindowDays}-day returns</span>
                  <span className="trust-desc">Return with any deduction shown first.</span>
                </div>
              </div>
              {d.warrantyMonths > 0 && (
                <div className="trust-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--success))" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <div>
                    <span className="trust-title">{d.warrantyMonths}-month warranty</span>
                    <span className="trust-desc">Serviced by CertiBuy.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seller profile — CertiBuy is the custody seller */}
          <div className="seller-profile surface">
            <div className="seller-profile-header">
              <div className="seller-logo">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10" strokeWidth="2.5"/></svg>
              </div>
              <div className="seller-name-wrap">
                <span className="seller-name">CertiBuy</span>
                <span className="seller-verified">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="hsl(var(--primary))" stroke="hsl(var(--primary-foreground))" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Verified Seller
                </span>
              </div>
            </div>
            <div className="seller-stats">
              <div className="seller-stat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Custody-first marketplace</span>
              </div>
              <div className="seller-stat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>Technician-graded devices</span>
              </div>
              <div className="seller-stat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span>Escrow-protected payments</span>
              </div>
            </div>
            <p className="seller-bio">Every device on CertiBuy is in our custody, graded by a technician, and backed by escrow. No peer-to-peer shipping, ever.</p>
          </div>

          {/* Grade strip */}
          {d.gradeStrip.length > 1 && (
            <div className="grade-strip surface">
              <h3 className="strip-title">Other grades available</h3>
              {d.gradeStrip.filter((g) => g.listingId !== d.listingId).map((g) => (
                <Link
                  key={g.listingId}
                  href={`/shop/listing/${g.listingId}`}
                  className="strip-item"
                  style={{ textDecoration: "none" }}
                >
                  <GradeChip grade={g.grade} size="sm" />
                  <span className="strip-label">{gradeLabel(g.grade)}</span>
                  <span className="strip-price">{formatINR(g.price)}</span>
                </Link>
              ))}
            </div>
          )}
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
          margin: 0.75rem 0 0.25rem;
        }
        .detail-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
          color: hsl(var(--foreground));
        }
        .detail-title-storage {
          font-size: 0.9375rem;
          color: hsl(var(--muted));
        }
        .detail-subtitle {
          font-size: 0.8125rem;
          color: hsl(var(--muted));
          margin: 0 0 1.25rem;
        }

        /* Layout */
        .detail-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.25rem;
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
          padding: 2.5rem 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 340px;
          background: hsl(var(--card));
        }
        .photo-badge {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.6875rem;
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

        /* ── Inspection report ── */
        .inspection-card { padding: 0; overflow: hidden; }
        .inspection-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          background: hsl(var(--primary) / 0.03);
          border-bottom: 1px solid hsl(var(--border));
        }
        .inspection-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .inspection-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: hsl(var(--primary) / 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .inspection-title {
          font-size: 1rem;
          font-weight: 700;
          color: hsl(var(--foreground));
          margin: 0;
        }
        .inspection-grade-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.125rem;
        }
        .inspection-grade-label {
          font-size: 0.625rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: hsl(var(--muted));
          text-transform: uppercase;
        }
        .inspection-grade-letter {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 2rem;
          font-weight: 400;
          color: hsl(var(--primary));
          line-height: 1;
        }

        /* Checklist */
        .checklist-section {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid hsl(var(--border));
        }
        .checklist-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .checklist-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        .checklist-count {
          font-size: 0.75rem;
          font-weight: 600;
          color: hsl(var(--success));
          background: hsl(var(--success) / 0.08);
          padding: 0.1875rem 0.5rem;
          border-radius: 9999px;
        }
        .checklist-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.5rem;
        }
        .checklist-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.625rem;
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          background: hsl(var(--background));
        }
        .item-pass { }
        .item-fail { background: hsl(var(--destructive) / 0.04); }
        .checklist-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .checklist-name {
          flex: 1;
          color: hsl(var(--foreground));
        }
        .checklist-result {
          font-weight: 600;
          font-size: 0.75rem;
        }
        .result-pass { color: hsl(var(--success)); }
        .result-fail { color: hsl(var(--destructive)); }

        /* Battery section in inspection */
        .battery-section {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid hsl(var(--border));
        }
        .battery-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .battery-detail-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        .battery-detail-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: hsl(var(--foreground));
        }
        .battery-bar-lg {
          height: 8px;
          background: hsl(var(--border));
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 0.375rem;
        }
        .battery-fill-lg {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s;
        }

        /* Inspection footer */
        .inspection-footer {
          display: flex;
          gap: 0;
          padding: 0;
        }
        .inspection-footer-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 1rem 0.75rem;
          border-right: 1px solid hsl(var(--border));
        }
        .inspection-footer-item:last-child { border-right: none; }
        .footer-label {
          font-size: 0.5625rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          color: hsl(var(--muted));
          text-transform: uppercase;
        }
        .footer-value {
          font-size: 0.8125rem;
          font-weight: 600;
          color: hsl(var(--foreground));
        }

        /* Device specs */
        .specs-card { padding: 1.5rem; }
        .specs-grid { display: flex; flex-direction: column; gap: 0; }
        .spec-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid hsl(var(--border));
          font-size: 0.875rem;
        }
        .spec-row:last-child { border-bottom: none; }
        .spec-label { color: hsl(var(--muted)); }
        .spec-value { color: hsl(var(--foreground)); font-weight: 500; }

        /* Sidebar */
        .detail-sidebar {
          position: sticky;
          top: 112px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .sidebar-card { padding: 1.5rem; }
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
          line-height: 1.2;
        }
        .sidebar-original {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.125rem 0 0.5rem;
        }
        .original-strike {
          font-size: 0.875rem;
          color: hsl(var(--muted));
          text-decoration: line-through;
        }
        .save-pct {
          font-size: 0.75rem;
          font-weight: 600;
          color: hsl(var(--success));
          background: hsl(var(--success) / 0.08);
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
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
          padding-top: 1rem;
          border-top: 1px solid hsl(var(--border));
        }
        .trust-item {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
        }
        .trust-item svg { flex-shrink: 0; margin-top: 0.125rem; }
        .trust-title {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        .trust-desc {
          display: block;
          font-size: 0.75rem;
          color: hsl(var(--muted));
          line-height: 1.4;
        }

        /* Seller profile */
        .seller-profile { padding: 1.25rem; }
        .seller-profile-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .seller-logo {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: hsl(var(--primary) / 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .seller-name-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .seller-name {
          font-size: 1rem;
          font-weight: 700;
          color: hsl(var(--foreground));
        }
        .seller-verified {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.6875rem;
          font-weight: 600;
          color: hsl(var(--primary));
        }
        .seller-stats {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.875rem;
        }
        .seller-stat {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: hsl(var(--muted));
        }
        .seller-stat svg { flex-shrink: 0; }
        .seller-bio {
          font-size: 0.75rem;
          line-height: 1.5;
          color: hsl(var(--muted));
          margin: 0;
          padding-top: 0.75rem;
          border-top: 1px solid hsl(var(--border));
        }

        /* Grade strip */
        .grade-strip {
          padding: 1rem 1.25rem;
        }
        .strip-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: hsl(var(--foreground));
          margin: 0 0 0.75rem;
        }
        .strip-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0;
          border-top: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
          font-size: 0.8125rem;
        }
        .strip-label { flex: 1; color: hsl(var(--muted)); }
        .strip-price { font-weight: 600; }

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
          .inspection-footer { flex-wrap: wrap; }
          .inspection-footer-item { min-width: 45%; border-bottom: 1px solid hsl(var(--border)); }
          .photo-hero { min-height: 240px; padding: 1.5rem 1rem; }
        }
      `}</style>
    </div>
  );
}
