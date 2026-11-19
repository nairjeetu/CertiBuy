"use client";

import { useDeviceCatalogue } from "@/hooks/use-seller";
import { DeviceImage } from "@/components/shop/DeviceImage";
import { StepRail } from "./StepRail";
import { formatINR } from "@/lib/format";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CatalogueModel {
  id: string;
  brand: string;
  model: string;
  storage: string;
  category: string;
  marketPriceA: number;
  inPriceBand: boolean;
  priceBandReason: string | null;
}

export function ModelPickerClient() {
  const { data, isLoading, error } = useDeviceCatalogue();
  const router = useRouter();
  const [category, setCategory] = useState<string>("all");
  const [brand, setBrand] = useState<string>("all");
  const [search, setSearch] = useState("");

  if (isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading catalogue...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))", padding: "1rem" }}>{(error as Error).message}</p>;

  const models = (data?.models ?? []) as CatalogueModel[];
  const brands = (data?.brands ?? []) as string[];
  const categories = (data?.categories ?? []) as string[];

  const filtered = models.filter((m) => {
    if (category !== "all" && m.category !== category) return false;
    if (brand !== "all" && m.brand !== brand) return false;
    if (search) {
      const q = search.toLowerCase();
      return `${m.brand} ${m.model} ${m.storage}`.toLowerCase().includes(q);
    }
    return true;
  });

  function handleSelect(model: CatalogueModel) {
    if (!model.inPriceBand) return;
    router.push(`/seller/sell/new?modelId=${model.id}`);
  }

  return (
    <div className="picker-page">
      <StepRail current={0} />

      <h1 className="picker-title">What are you selling?</h1>
      <p className="meta" style={{ marginBottom: "1.25rem" }}>Pick from the catalogue. The price depends on the grade the technician gives it.</p>

      {/* Search */}
      <div className="search-box">
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input
          type="text"
          placeholder="Search a brand or model"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Category pills */}
      <div className="pill-row">
        <button onClick={() => setCategory("all")} className={`pill ${category === "all" ? "pill-active" : ""}`}>All</button>
        {categories.map((c) => (
          <button key={c} onClick={() => setCategory(c)} className={`pill ${category === c ? "pill-active" : ""}`} style={{ textTransform: "capitalize" }}>{c}</button>
        ))}
      </div>

      {/* Brand pills */}
      <div className="pill-row brand-row">
        <button onClick={() => setBrand("all")} className={`pill pill-sm ${brand === "all" ? "pill-active" : ""}`}>All brands</button>
        {brands.map((b) => (
          <button key={b} onClick={() => setBrand(b)} className={`pill pill-sm ${brand === b ? "pill-active" : ""}`}>{b}</button>
        ))}
      </div>

      {/* Results count */}
      <p className="result-count">{filtered.length} model{filtered.length !== 1 ? "s" : ""}</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="empty-state surface">
          <p>No models match your search.</p>
          <button className="clear-btn" onClick={() => { setSearch(""); setCategory("all"); setBrand("all"); }}>Clear filters</button>
        </div>
      ) : (
        <div className="model-grid">
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelect(m)}
              disabled={!m.inPriceBand}
              className={`model-card surface ${!m.inPriceBand ? "model-card-disabled" : ""}`}
            >
              <div className="model-card-img">
                <DeviceImage brand={m.brand} model={m.model} size="sm" />
              </div>
              <div className="model-card-info">
                <span className="model-card-name">{m.brand} {m.model}</span>
                <span className="meta">{m.storage} · {m.category}</span>
              </div>
              <div className="model-card-price">
                <span>Up to {formatINR(m.marketPriceA)}</span>
                {!m.inPriceBand && (
                  <span className="model-card-reason">{m.priceBandReason}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .picker-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
        }

        .picker-title {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 1.5rem;
          font-weight: 400;
          margin: 0 0 0.25rem;
          color: hsl(var(--foreground));
        }

        /* Search */
        .search-box {
          position: relative;
          margin-bottom: 1rem;
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
          box-sizing: border-box;
        }
        .search-input:focus { outline: 2px solid hsl(var(--ring)); outline-offset: 1px; }

        /* Pills */
        .pill-row {
          display: flex;
          gap: 0.375rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }
        .brand-row { margin-bottom: 1rem; }
        .pill {
          padding: 0.3125rem 0.75rem;
          border-radius: 9999px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          cursor: pointer;
          font-size: 0.8125rem;
          transition: all 0.15s;
        }
        .pill-sm { font-size: 0.75rem; padding: 0.25rem 0.625rem; }
        .pill-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-color: hsl(var(--primary));
        }
        .pill:not(.pill-active):hover { background: hsl(var(--secondary)); }

        .result-count {
          font-size: 0.8125rem;
          color: hsl(var(--muted));
          margin: 0 0 0.75rem;
        }

        /* Grid */
        .model-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .model-card {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          cursor: pointer;
          text-align: left;
          width: 100%;
          border: none;
          transition: box-shadow 0.15s;
        }
        .model-card:hover:not(:disabled) { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .model-card-disabled { opacity: 0.5; cursor: not-allowed; }
        .model-card-img {
          width: 40px; height: 40px;
          background: hsl(var(--background));
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .model-card-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          min-width: 0;
        }
        .model-card-name { font-weight: 600; font-size: 0.875rem; color: hsl(var(--foreground)); }
        .model-card-price {
          text-align: right;
          font-weight: 600;
          font-size: 0.8125rem;
          color: hsl(var(--foreground));
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.125rem;
        }
        .model-card-reason { font-weight: 400; font-size: 0.6875rem; color: hsl(var(--destructive)); }

        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: hsl(var(--muted));
        }
        .clear-btn {
          margin-top: 0.75rem;
          padding: 0.5rem 1rem;
          border: 1px solid hsl(var(--border));
          border-radius: 9999px;
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          font-size: 0.8125rem;
          cursor: pointer;
        }
        .clear-btn:hover { background: hsl(var(--secondary)); }

        @media (max-width: 640px) {
          .model-grid { grid-template-columns: 1fr; }
          .stepper { gap: 0.125rem; }
        }
      `}</style>
    </div>
  );
}
