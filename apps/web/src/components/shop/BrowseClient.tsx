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
  warrantyMonths: number;
}

export function BrowseClient() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const params = { ...filters, page: String(page) };
  const { data, isLoading, error } = useShopCatalogue(params);

  const items = (data?.items ?? []) as Card[];
  const total = (data?.total ?? 0) as number;
  const limit = (data?.limit ?? 20) as number;
  const brands = (data?.facets?.brands ?? []) as string[];
  const storages = (data?.facets?.storages ?? []) as string[];
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
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>All devices</h2>
      <FilterPanel brands={brands} storages={storages} filters={filters} onChange={handleFilter} />

      {isLoading && <p>Loading...</p>}
      {error && <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>}

      {!isLoading && items.length === 0 && (
        <p style={{ color: "#6b7280" }}>No devices match your filters.</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
        {items.map((c) => <ListingCard key={c.listingId} {...c} />)}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: "0.375rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 6, cursor: page <= 1 ? "default" : "pointer" }}>
            Previous
          </button>
          <span style={{ padding: "0.375rem 0.75rem", fontSize: "0.875rem" }}>
            Page {page} of {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ padding: "0.375rem 0.75rem", border: "1px solid #d1d5db", borderRadius: 6, cursor: page >= totalPages ? "default" : "pointer" }}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
