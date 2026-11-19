"use client";

interface Props {
  brands: string[];
  storages: string[];
  filters: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

const CATEGORIES = ["Everything", "Phones", "Laptops", "Tablets"];
const GRADES = ["A", "B", "C", "D"];
const PRICE_RANGES = [
  { label: "Under ₹25,000", min: "", max: "25000" },
  { label: "₹25,000 – ₹40,000", min: "25000", max: "40000" },
  { label: "₹40,000 – ₹70,000", min: "40000", max: "70000" },
  { label: "Above ₹70,000", min: "70000", max: "" },
];

export function FilterPanel({ brands, storages, filters, onChange }: Props) {
  const activeCat = filters.category ?? "";
  const activeGrade = filters.grade ?? "";
  const activeBrand = filters.brand ?? "";

  return (
    <div className="filter-panel surface">
      <h3 className="filter-heading">Filters</h3>

      {/* Category */}
      <div className="filter-section">
        <span className="filter-label">CATEGORY</span>
        <div className="filter-pills">
          {CATEGORIES.map((c) => {
            const val = c === "Everything" ? "" : c.toLowerCase();
            const active = activeCat === val;
            return (
              <button key={c} className={`pill ${active ? "pill-active" : ""}`} onClick={() => onChange("category", val)}>
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand */}
      <div className="filter-section">
        <span className="filter-label">BRAND</span>
        <div className="filter-radios">
          {brands.map((b) => (
            <label key={b} className="radio-label">
              <input type="radio" name="brand" checked={activeBrand === b} onChange={() => onChange("brand", activeBrand === b ? "" : b)} className="radio-input" />
              {b}
            </label>
          ))}
        </div>
      </div>

      {/* Grade */}
      <div className="filter-section">
        <span className="filter-label">GRADE</span>
        <div className="filter-pills">
          {GRADES.map((g) => {
            const active = activeGrade === g;
            return (
              <button key={g} className={`pill pill-sm ${active ? "pill-active" : ""}`} onClick={() => onChange("grade", active ? "" : g)}>
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price */}
      <div className="filter-section">
        <span className="filter-label">PRICE</span>
        <div className="price-inputs">
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin ?? ""}
            onChange={(e) => onChange("priceMin", e.target.value)}
            className="price-input"
          />
          <span className="price-to">to</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax ?? ""}
            onChange={(e) => onChange("priceMax", e.target.value)}
            className="price-input"
          />
        </div>
        <div className="price-chips">
          {PRICE_RANGES.map((r) => (
            <button
              key={r.label}
              className="price-chip"
              onClick={() => { onChange("priceMin", r.min); onChange("priceMax", r.max); }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Storage */}
      <div className="filter-section">
        <span className="filter-label">STORAGE</span>
        <select
          value={filters.storage ?? ""}
          onChange={(e) => onChange("storage", e.target.value)}
          className="filter-select"
        >
          <option value="">Any storage</option>
          {storages.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <style jsx>{`
        .filter-panel { padding: 1.25rem; }
        .filter-heading {
          font-size: 1rem;
          font-weight: 700;
          margin: 0 0 1rem;
          color: hsl(var(--foreground));
        }
        .filter-section {
          margin-bottom: 1.25rem;
        }
        .filter-label {
          display: block;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: hsl(var(--muted));
          margin-bottom: 0.5rem;
        }
        .filter-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
        }
        .pill {
          padding: 0.375rem 0.75rem;
          border: 1px solid hsl(var(--border));
          border-radius: 9999px;
          background: hsl(var(--card));
          font-size: 0.8125rem;
          color: hsl(var(--foreground));
          cursor: pointer;
          transition: all 0.15s;
        }
        .pill:hover { background: hsl(var(--secondary)); }
        .pill-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-color: hsl(var(--primary));
        }
        .pill-active:hover {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .pill-sm {
          min-width: 36px;
          text-align: center;
          padding: 0.375rem 0.5rem;
        }
        .filter-radios {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8125rem;
          color: hsl(var(--foreground));
          cursor: pointer;
        }
        .radio-input {
          accent-color: hsl(var(--primary));
        }
        .price-inputs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .price-input {
          flex: 1;
          padding: 0.375rem 0.5rem;
          border: 1px solid hsl(var(--input));
          border-radius: 0.5rem;
          font-size: 0.8125rem;
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          max-width: 80px;
        }
        .price-to {
          font-size: 0.75rem;
          color: hsl(var(--muted));
        }
        .price-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }
        .price-chip {
          padding: 0.25rem 0.5rem;
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
          background: hsl(var(--card));
          font-size: 0.6875rem;
          color: hsl(var(--foreground));
          cursor: pointer;
          transition: background 0.15s;
        }
        .price-chip:hover { background: hsl(var(--secondary)); }
        .filter-select {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid hsl(var(--input));
          border-radius: 0.875rem;
          font-size: 0.8125rem;
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
