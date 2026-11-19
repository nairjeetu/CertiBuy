"use client";

import { useShopHome } from "@/hooks/use-shop";
import { ListingCard } from "./ListingCard";
import Link from "next/link";
import Image from "next/image";

interface Card {
  listingId: string;
  brand: string;
  model: string;
  storage: string;
  grade: string;
  currentPrice: number;
  warrantyMonths: number;
  imageUrl?: string;
  category?: string;
}

/* ── Skeletons ────────────────────────────────────────────────────────── */

function CardSkeleton() {
  return (
    <div className="skeleton-card surface">
      <div className="skeleton-image" />
      <div className="skeleton-body">
        <div className="skeleton-line" style={{ width: "70%" }} />
        <div className="skeleton-line" style={{ width: "40%", height: 10 }} />
        <div className="skeleton-line" style={{ width: "50%", marginTop: "auto" }} />
      </div>
    </div>
  );
}

/* ── Feature cards ────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4"/>
        <path d="M12 3c-1.2 0-2.4.6-3 1.5A3.5 3.5 0 0 0 5 8v3c0 4 3 8 7 10 4-2 7-6 7-10V8a3.5 3.5 0 0 0-4-3.5A3.8 3.8 0 0 0 12 3z"/>
      </svg>
    ),
    title: "Technician graded",
    desc: "A technician sets the final grade, against a checklist and the battery test.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: "Escrow protected",
    desc: "Your payment is held until the return window closes, never released on the day you buy.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10"/>
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
      </svg>
    ),
    title: "7-day returns",
    desc: "Not as graded, dead on arrival, or a change of mind — every route is priced up front.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    title: "1-year warranty",
    desc: "Grade A to C devices carry a full year, with a second year you can add at checkout.",
  },
];

/* ── Grade descriptions for "Shop by grade" section ──────────────────── */

const GRADES = [
  { grade: "A", label: "Like new", desc: "No marks on the body or the glass, and the battery is at 90% or better." },
  { grade: "B", label: "Light signs of use", desc: "Small scratches you only catch at an angle. Battery between 85% and 89%." },
  { grade: "C", label: "Visible wear", desc: "Scratches or small dents you can see at a glance. Battery between 80% and 84%." },
  { grade: "D", label: "Flawed, refurbished", desc: "Heavy wear or a fault repaired in our workshop. Sold without a warranty and only once it passes re-inspection." },
];

/* ── Main component ───────────────────────────────────────────────────── */

export function ShopHomeClient() {
  const { data, isLoading, error } = useShopHome();

  if (error) {
    return (
      <div className="shop-container">
        <div className="shop-empty surface">
          <p>Something went wrong loading the shop.</p>
          <p className="meta">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const newest = (data?.newest ?? []) as Card[];
  const gradeAPicks = (data?.gradeAPicks ?? []) as Card[];
  const totalActive = (data?.totalActive ?? 0) as number;
  const gradeCounts = (data?.gradeCounts ?? {}) as Record<string, number>;

  return (
    <div className="shop-container">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="hero surface animate-rise">
        <div className="hero-content">
          <span className="hero-eyebrow">CERTIFIED · CUSTODY FIRST</span>
          <h1 className="hero-headline">
            Buy Smart.<br />
            Sell Better.<br />
            Trust Every Device.
          </h1>
          <p className="hero-body">
            Every device here was graded by a technician and is already in our
            hands before you pay. Your money sits in escrow until the 7-day
            return window closes.
          </p>
          <div className="hero-actions">
            <Link href="/shop/browse" className="btn-primary">
              Shop certified devices →
            </Link>
            <Link href="/shop/grades" className="btn-secondary">
              How grading works
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <Image
            src="/hero-device.svg"
            alt="CertiBuy certified device"
            width={280}
            height={350}
            priority
          />
          <div className="hero-report-card surface">
            <span className="hero-report-label">INSPECTION REPORT</span>
            <span className="hero-report-grade">A grade</span>
            <span className="hero-report-name">Apple iPhone 14</span>
            <span className="meta">92% battery · graded and sealed</span>
            <span className="hero-report-footnote">Photo of this exact unit · in our custody</span>
          </div>
        </div>
      </section>

      {/* ── Feature cards ─────────────────────────────────────────────── */}
      <section className="features-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature-card surface">
            <div className="feature-icon">{f.icon}</div>
            <h3 className="feature-title">{f.title}</h3>
            <p className="feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── Shop by grade ──────────────────────────────────────────── */}
      <section className="shop-section">
        <div className="section-header">
          <div>
            <h2 className="section-title">Shop by grade</h2>
            <p className="section-subtitle">The grade is the technician&apos;s verdict, not the seller&apos;s description.</p>
          </div>
          <Link href="/shop/grades" className="section-link">What the grades mean →</Link>
        </div>
        <div className="grade-cards-grid">
          {GRADES.map((g) => (
            <Link key={g.grade} href={`/shop/browse?grade=${g.grade}`} className="grade-card surface">
              <div className="grade-card-top">
                <span className="grade-card-letter">{g.grade}</span>
                <span className="meta">{gradeCounts[g.grade] ?? 0} in stock</span>
              </div>
              <p className="grade-card-label">{g.label}</p>
              <p className="grade-card-desc">{g.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Grade A, ready to ship ───────────────────────────────────── */}
      {isLoading ? (
        <section className="shop-section">
          <h2 className="section-title">Grade A, ready to ship</h2>
          <div className="listing-grid">
            {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
          </div>
        </section>
      ) : gradeAPicks.length > 0 ? (
        <section className="shop-section animate-fade">
          <div className="section-header">
            <div>
              <h2 className="section-title">Grade A, ready to ship</h2>
              <p className="section-subtitle">Like new, battery checked, every one photographed at the hub.</p>
            </div>
            <Link href="/shop/browse?grade=A" className="section-link">All {totalActive} devices →</Link>
          </div>
          <div className="listing-grid">
            {gradeAPicks.map((c) => <ListingCard key={c.listingId} {...c} />)}
          </div>
        </section>
      ) : newest.length > 0 ? (
        <section className="shop-section animate-fade">
          <div className="section-header">
            <h2 className="section-title">Just listed</h2>
            <Link href="/shop/browse" className="section-link">View all {totalActive} devices →</Link>
          </div>
          <div className="listing-grid">
            {newest.map((c) => <ListingCard key={c.listingId} {...c} />)}
          </div>
        </section>
      ) : (
        <section className="shop-section">
          <div className="shop-empty surface">
            <p>No devices listed yet. Check back soon.</p>
          </div>
        </section>
      )}

      <style jsx>{`
        .shop-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
        }

        /* ── Hero ─────────────────────────────────────────────────── */
        .hero {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 2rem;
          padding: 2.5rem;
          margin-bottom: 1.5rem;
        }
        .hero-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .hero-eyebrow {
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: hsl(var(--muted));
          margin-bottom: 0.75rem;
        }
        .hero-headline {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 2.5rem;
          font-weight: 400;
          line-height: 1.15;
          color: hsl(var(--primary));
          margin: 0 0 1rem;
        }
        .hero-body {
          font-size: 0.9375rem;
          line-height: 1.6;
          color: hsl(var(--muted));
          max-width: 460px;
          margin: 0 0 1.5rem;
        }
        .hero-actions {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          padding: 0.625rem 1.25rem;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .btn-primary:hover { opacity: 0.9; }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          padding: 0.625rem 1.25rem;
          border: 1px solid hsl(var(--border));
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          color: hsl(var(--foreground));
          transition: background 0.15s;
        }
        .btn-secondary:hover { background: hsl(var(--secondary)); }

        /* Hero visual */
        .hero-visual {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .hero-report-card {
          position: absolute;
          bottom: 1rem;
          left: -1rem;
          padding: 0.75rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          max-width: 220px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
        }
        .hero-report-label {
          font-size: 0.5625rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: hsl(var(--muted));
        }
        .hero-report-grade {
          display: inline-block;
          align-self: flex-start;
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          background: hsl(160 84% 92%);
          color: hsl(160 84% 25%);
          margin: 0.125rem 0;
        }
        .hero-report-name {
          font-size: 0.8125rem;
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        .hero-report-footnote {
          font-size: 0.625rem;
          color: hsl(var(--muted));
          margin-top: 0.25rem;
          font-style: italic;
        }

        /* ── Feature cards ────────────────────────────────────────── */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .feature-card {
          padding: 1.25rem;
        }
        .feature-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: hsl(var(--primary) / 0.08);
          color: hsl(var(--primary));
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.75rem;
        }
        .feature-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(var(--foreground));
          margin: 0 0 0.375rem;
        }
        .feature-desc {
          font-size: 0.8125rem;
          line-height: 1.5;
          color: hsl(var(--muted));
          margin: 0;
        }

        /* ── Grade cards ──────────────────────────────────────────── */
        .grade-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        .grade-card {
          display: block;
          text-decoration: none;
          color: inherit;
          padding: 1.25rem;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .grade-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
        }
        .grade-card-top {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 0.5rem;
        }
        .grade-card-letter {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 1.75rem;
          color: hsl(var(--foreground));
          line-height: 1;
        }
        .grade-card-label {
          margin: 0 0 0.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        .grade-card-desc {
          margin: 0;
          font-size: 0.8125rem;
          line-height: 1.5;
          color: hsl(var(--muted));
        }

        /* ── Listings ─────────────────────────────────────────────── */
        .shop-section { margin-bottom: 2rem; }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 0.875rem;
        }
        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: hsl(var(--foreground));
        }
        .section-subtitle {
          font-size: 0.8125rem;
          color: hsl(var(--muted));
          margin: 0.25rem 0 0;
        }
        .section-link {
          font-size: 0.8125rem;
          font-weight: 500;
          color: hsl(var(--primary));
          text-decoration: none;
          white-space: nowrap;
        }
        .listing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 1rem;
        }

        /* ── Empty / skeleton ─────────────────────────────────────── */
        .shop-empty {
          text-align: center;
          padding: 3rem 1rem;
          color: hsl(var(--muted));
        }
        .skeleton-card { overflow: hidden; }
        .skeleton-image {
          aspect-ratio: 1;
          background: hsl(var(--border));
          animation: pulse 1.5s ease-in-out infinite;
        }
        .skeleton-body {
          padding: 0.875rem 1rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          min-height: 80px;
        }
        .skeleton-line {
          height: 14px;
          border-radius: 4px;
          background: hsl(var(--border));
          animation: pulse 1.5s ease-in-out infinite;
        }

        /* ── Responsive ───────────────────────────────────────────── */
        @media (max-width: 768px) {
          .hero {
            grid-template-columns: 1fr;
            padding: 1.5rem;
          }
          .hero-visual { display: none; }
          .hero-headline { font-size: 2rem; }
          .features-grid { grid-template-columns: repeat(2, 1fr); }
          .grade-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .features-grid { grid-template-columns: 1fr; }
          .grade-cards-grid { grid-template-columns: 1fr; }
          .listing-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          .hero-actions { flex-direction: column; }
          .btn-primary, .btn-secondary { justify-content: center; }
        }
      `}</style>
    </div>
  );
}
