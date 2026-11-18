"use client";

import { useState } from "react";
import { useShopCatalogue } from "@/hooks/use-shop";
import { ListingCard } from "./ListingCard";
import { FilterPanel } from "./FilterPanel";
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

export function BrowseClient() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const params = { ...filters, page: String(page) };
  const { data, isLoading, error } = useShopCatalogue(params);

  const d = data as { items?: Card[]; total?: number; limit?: number; facets?: { brands?: string[]; storages?: string[] } } | undefined;
  const items = d?.items ?? [];
  const total = d?.total ?? 0;
  const limit = d?.limit ?? 20;
  const brands = d?.facets?.brands ?? [];
  const storages = d?.facets?.storages ?? [];
  const totalPages = Math.ceil(total / limit);

  const handleFilter = (key: string, value: string) => {
    setPage(1);
    setFilters((prev) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  };

  return (
    <div className="browse-container">
      <div className="browse-header">
        <div>
          <Link href="/shop" className="browse-back">← Back to shop</Link>
          <h1 className="browse-title">All devices</h1>
          {!isLoading && <p className="browse-count">{total} device{total !== 1 ? "s" : ""} found</p>}
        </div>
      </div>

      <FilterPanel brands={brands} storages={storages} filters={filters} onChange={handleFilter} />

      {isLoading && (
        <div className="browse-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-image" />
              <div className="skeleton-body">
                <div className="skeleton-line" style={{ width: "70%" }} />
                <div className="skeleton-line" style={{ width: "40%", height: 10 }} />
                <div className="skeleton-line" style={{ width: "50%", marginTop: 12 }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <p className="browse-error">{(error as Error).message}</p>}

      {!isLoading && items.length === 0 && (
        <div className="browse-empty">
          <span style={{ fontSize: "2.5rem" }}>🔍</span>
          <p>No devices match your filters</p>
          <button className="browse-clear-btn" onClick={() => { for (const key of Object.keys(filters)) handleFilter(key, ""); }}>
            Clear filters
          </button>
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="browse-grid">
          {items.map((c) => <ListingCard key={c.listingId} {...c} />)}
        </div>
      )}

      {totalPages > 1 && (
        <div className="browse-pagination">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="page-btn"
          >
            Previous
          </button>
          <span className="page-info">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="page-btn"
          >
            Next
          </button>
        </div>
      )}

      <style jsx>{`
        .browse-container {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 1rem 3rem;
        }
        .browse-header {
          padding: 1rem 0 1.25rem;
        }
        .browse-back {
          font-size: 0.8125rem;
          color: var(--muted);
          text-decoration: none;
        }
        .browse-back:hover { color: var(--accent); }
        .browse-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0.25rem 0 0;
          letter-spacing: -0.01em;
        }
        .browse-count {
          margin: 0.25rem 0 0;
          font-size: 0.8125rem;
          color: var(--muted);
        }

        .browse-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .browse-empty {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--muted);
        }
        .browse-empty p { margin: 0.5rem 0; }
        .browse-clear-btn {
          margin-top: 0.5rem;
          padding: 0.5rem 1rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          color: var(--fg);
          font-size: 0.8125rem;
          cursor: pointer;
        }
        .browse-error { color: #dc2626; }

        .browse-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
          margin-top: 2rem;
        }
        .page-btn {
          padding: 0.5rem 1rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          color: var(--fg);
          font-size: 0.8125rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .page-btn:hover:not(:disabled) { background: var(--border); }
        .page-btn:disabled { opacity: 0.4; cursor: default; }
        .page-info {
          font-size: 0.8125rem;
          color: var(--muted);
        }

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
          .browse-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
        }
      `}</style>
    </div>
  );
}
