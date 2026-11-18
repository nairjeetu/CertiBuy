"use client";

interface Props {
  brands: string[];
  storages: string[];
  filters: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function FilterPanel({ brands, storages, filters, onChange }: Props) {
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="filter-panel">
      <div className="filter-row">
        <select
          value={filters.brand ?? ""}
          onChange={(e) => onChange("brand", e.target.value)}
          className="filter-select"
          aria-label="Filter by brand"
        >
          <option value="">All brands</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>

        <select
          value={filters.grade ?? ""}
          onChange={(e) => onChange("grade", e.target.value)}
          className="filter-select"
          aria-label="Filter by grade"
        >
          <option value="">All grades</option>
          {["A", "B", "C", "D"].map((g) => <option key={g} value={g}>Grade {g}</option>)}
        </select>

        <select
          value={filters.storage ?? ""}
          onChange={(e) => onChange("storage", e.target.value)}
          className="filter-select"
          aria-label="Filter by storage"
        >
          <option value="">All storage</option>
          {storages.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={filters.sort ?? ""}
          onChange={(e) => onChange("sort", e.target.value)}
          className="filter-select"
          aria-label="Sort order"
        >
          <option value="">Newest first</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
        </select>
      </div>

      {activeCount > 0 && (
        <button
          className="filter-clear"
          onClick={() => {
            for (const key of Object.keys(filters)) onChange(key, "");
          }}
        >
          Clear all filters ({activeCount})
        </button>
      )}

      <style jsx>{`
        .filter-panel {
          margin-bottom: 1.25rem;
        }
        .filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .filter-select {
          flex: 1;
          min-width: 140px;
          padding: 0.5rem 0.75rem;
          border: 1px solid hsl(var(--border));
          border-radius: 0.875rem;
          font-size: 0.8125rem;
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .filter-select:focus {
          border-color: hsl(var(--ring));
        }
        .filter-clear {
          margin-top: 0.5rem;
          padding: 0.25rem 0.75rem;
          border: none;
          background: none;
          color: hsl(var(--primary));
          font-size: 0.8125rem;
          cursor: pointer;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
