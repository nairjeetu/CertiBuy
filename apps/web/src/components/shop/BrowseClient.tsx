"use client";

import { useState } from "react";
import { useShopCatalogue } from "@/hooks/use-shop";
import { ListingCard } from "./ListingCard";
import { FilterPanel } from "./FilterPanel";

interface Card {
  listingId: string;
  brand: string;
  model: string;
  storage: string;
  grade: string;
  currentPrice: number;
  originalPrice?: number;
  warrantyMonths: number;
  imageUrl?: string;
  category?: string;
}

export function BrowseClient() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("");
  const [search, setSearch] = useState("");

  const params = { ...filters, page: String(page), ...(sort ? { sort } : {}), ...(search ? { search } : {}) };
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
    <div className="browse-page">
      <div className="browse-layout">
        {/* Left sidebar: filters */}
        <aside className="browse-sidebar">
          <FilterPanel brands={brands} storages={storages} filters={filters} onChange={handleFilter} />
        </aside>

        {/* Right: search + sort + grid */}
        <div className="browse-main">
          <div className="browse-toolbar">
            <div className="search-box">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search a brand or model"
                className="search-input"
              />
            </div>
            <div className="browse-sort">
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} className="sort-select">
                <option value="">Best grade first</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="newest">Newest first</option>
              </select>
            </div>
          </div>

          {!isLoading && <p className="browse-count">{total} device{total !== 1 ? "s" : ""} in stock</p>}

          {isLoading && (
            <div className="browse-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton-card surface">
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
            <div className="browse-empty surface">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p>No devices match your filters</p>
              <button className="browse-clear-btn" onClick={() => { for (const key of Object.keys(filters)) handleFilter(key, ""); setSearch(""); }}>
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
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="page-btn">Previous</button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="page-btn">Next</button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .browse-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
        }
        .browse-layout {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 1.5rem;
          align-items: start;
        }
        .browse-sidebar { position: sticky; top: 112px; }

        .browse-main { min-width: 0; }
        .browse-toolbar {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.75rem;
        }
        .search-box {
          flex: 1;
          position: relative;
        }
        .search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: hsl(var(--muted));
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 0.5rem 0.75rem 0.5rem 2.25rem;
          border: 1px solid hsl(var(--input));
          border-radius: var(--radius);
          font-size: 0.875rem;
          background: hsl(var(--card));
          color: hsl(var(--foreground));
        }
        .search-input:focus { outline: 2px solid hsl(var(--ring)); outline-offset: 1px; }
        .sort-select {
          padding: 0.5rem 0.75rem;
          border: 1px solid hsl(var(--input));
          border-radius: var(--radius);
          font-size: 0.8125rem;
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          cursor: pointer;
        }
        .browse-count {
          font-size: 0.8125rem;
          color: hsl(var(--muted));
          margin: 0 0 1rem;
        }

        .browse-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .browse-empty {
          text-align: center;
          padding: 3rem 1rem;
          color: hsl(var(--muted));
        }
        .browse-empty p { margin: 0.75rem 0 0; }
        .browse-clear-btn {
          margin-top: 0.75rem;
          padding: 0.5rem 1rem;
          border: 1px solid hsl(var(--border));
          border-radius: 9999px;
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          font-size: 0.8125rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .browse-clear-btn:hover { background: hsl(var(--secondary)); }
        .browse-error { color: hsl(var(--destructive)); }

        .browse-pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
          margin-top: 2rem;
        }
        .page-btn {
          padding: 0.5rem 1rem;
          border: 1px solid hsl(var(--border));
          border-radius: 9999px;
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          font-size: 0.8125rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .page-btn:hover:not(:disabled) { background: hsl(var(--secondary)); }
        .page-btn:disabled { opacity: 0.4; cursor: default; }
        .page-info { font-size: 0.8125rem; color: hsl(var(--muted)); }

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

        @media (max-width: 768px) {
          .browse-layout { grid-template-columns: 1fr; }
          .browse-sidebar { position: static; }
          .browse-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
        }
        @media (max-width: 480px) {
          .browse-grid { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
          .browse-toolbar { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
