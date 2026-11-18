"use client";

import { useShopHome } from "@/hooks/use-shop";
import { ListingCard } from "./ListingCard";
import Link from "next/link";

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

function SectionSkeleton() {
  return (
    <div className="shop-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-image" />
          <div className="skeleton-body">
            <div className="skeleton-line" style={{ width: "70%" }} />
            <div className="skeleton-line" style={{ width: "40%", height: 10 }} />
            <div className="skeleton-line" style={{ width: "50%", marginTop: "auto" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ShopHomeClient() {
  const { data, isLoading, error } = useShopHome();

  if (error) {
    return (
      <div className="shop-container">
        <div className="shop-error">
          <p>Something went wrong loading the shop.</p>
          <p className="shop-error-detail">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const newest = (data?.newest ?? []) as Card[];
  const gradeAPicks = (data?.gradeAPicks ?? []) as Card[];
  const totalActive = (data?.totalActive ?? 0) as number;

  return (
    <div className="shop-container">
      {/* Hero */}
      <section className="shop-hero">
        <div>
          <h1 className="shop-hero-title">Certified pre-owned devices</h1>
          <p className="shop-hero-subtitle">
            {isLoading ? "Loading..." : `${totalActive} devices available`} — inspected, graded, and covered by warranty.
          </p>
        </div>
        <div className="shop-hero-actions">
          <Link href="/shop/browse" className="btn-primary">
            Browse all devices
          </Link>
          <Link href="/shop/grades" className="btn-ghost">
            How grades work
          </Link>
        </div>
      </section>

      {/* Stats strip */}
      <section className="shop-stats">
        <div className="shop-stat">
          <span className="shop-stat-icon">🔍</span>
          <div>
            <span className="shop-stat-label">Inspected</span>
            <span className="shop-stat-desc">48-point check</span>
          </div>
        </div>
        <div className="shop-stat">
          <span className="shop-stat-icon">🛡</span>
          <div>
            <span className="shop-stat-label">Warranty</span>
            <span className="shop-stat-desc">Up to 3 months</span>
          </div>
        </div>
        <div className="shop-stat">
          <span className="shop-stat-icon">↩</span>
          <div>
            <span className="shop-stat-label">Returns</span>
            <span className="shop-stat-desc">7-day window</span>
          </div>
        </div>
        <div className="shop-stat">
          <span className="shop-stat-icon">🔒</span>
          <div>
            <span className="shop-stat-label">Secure pay</span>
            <span className="shop-stat-desc">Escrow protected</span>
          </div>
        </div>
      </section>

      {/* Just listed */}
      {isLoading ? (
        <section className="shop-section">
          <h2 className="shop-section-title">Just listed</h2>
          <SectionSkeleton />
        </section>
      ) : newest.length > 0 ? (
        <section className="shop-section">
          <div className="shop-section-header">
            <h2 className="shop-section-title">Just listed</h2>
            <Link href="/shop/browse" className="shop-section-link">View all →</Link>
          </div>
          <div className="shop-grid">
            {newest.map((c) => <ListingCard key={c.listingId} {...c} />)}
          </div>
        </section>
      ) : (
        <section className="shop-section">
          <div className="shop-empty">
            <span style={{ fontSize: "2rem" }}>📦</span>
            <p>No devices listed yet. Check back soon.</p>
          </div>
        </section>
      )}

      {/* Grade A picks */}
      {!isLoading && gradeAPicks.length > 0 && (
        <section className="shop-section">
          <div className="shop-section-header">
            <h2 className="shop-section-title">
              <span className="grade-a-dot" /> Grade A picks
            </h2>
            <Link href="/shop/browse?grade=A" className="shop-section-link">See all Grade A →</Link>
          </div>
          <div className="shop-grid">
            {gradeAPicks.map((c) => <ListingCard key={c.listingId} {...c} />)}
          </div>
        </section>
      )}

      <style jsx>{`
        .shop-container {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 1rem 3rem;
        }

        /* Hero */
        .shop-hero {
          padding: 2rem 0 1.5rem;
        }
        .shop-hero-title {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .shop-hero-subtitle {
          margin: 0.375rem 0 0;
          color: var(--muted);
          font-size: 0.9375rem;
        }
        .shop-hero-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.25rem;
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          padding: 0.625rem 1.25rem;
          background: var(--accent);
          color: #fff;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .btn-primary:hover { opacity: 0.9; }
        .btn-ghost {
          display: inline-flex;
          align-items: center;
          padding: 0.625rem 1.25rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          color: var(--fg);
          transition: background 0.15s;
        }
        .btn-ghost:hover { background: var(--border); }

        /* Stats */
        .shop-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          padding: 1rem 0 1.5rem;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          margin-bottom: 1.5rem;
        }
        .shop-stat {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }
        .shop-stat-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }
        .shop-stat-label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 600;
        }
        .shop-stat-desc {
          display: block;
          font-size: 0.6875rem;
          color: var(--muted);
        }

        /* Sections */
        .shop-section {
          margin-bottom: 2rem;
        }
        .shop-section-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 0.875rem;
        }
        .shop-section-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .shop-section-link {
          font-size: 0.8125rem;
          font-weight: 500;
          text-decoration: none;
          color: var(--accent);
        }
        .grade-a-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
        }

        /* Grid */
        .shop-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        /* Empty */
        .shop-empty {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--muted);
        }
        .shop-empty p { margin: 0.5rem 0 0; }

        /* Error */
        .shop-error {
          text-align: center;
          padding: 3rem 1rem;
        }
        .shop-error p { margin: 0 0 0.5rem; }
        .shop-error-detail { font-size: 0.8125rem; color: var(--muted); }

        /* Skeleton */
        .skeleton-card {
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }
        .skeleton-image {
          aspect-ratio: 1;
          background: var(--border);
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
          background: var(--border);
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @media (max-width: 640px) {
          .shop-hero-title { font-size: 1.375rem; }
          .shop-stats { grid-template-columns: repeat(2, 1fr); }
          .shop-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          .shop-hero-actions { flex-direction: column; }
          .btn-primary, .btn-ghost { justify-content: center; }
        }
      `}</style>
    </div>
  );
}
