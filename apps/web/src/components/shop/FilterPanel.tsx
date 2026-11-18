"use client";

interface Props {
  brands: string[];
  storages: string[];
  filters: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function FilterPanel({ brands, storages, filters, onChange }: Props) {
  const sel = { width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: 6, fontSize: "0.875rem" };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
      <select value={filters.brand ?? ""} onChange={(e) => onChange("brand", e.target.value)} style={sel}>
        <option value="">All brands</option>
        {brands.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
      <select value={filters.grade ?? ""} onChange={(e) => onChange("grade", e.target.value)} style={sel}>
        <option value="">All grades</option>
        {["A", "B", "C", "D"].map((g) => <option key={g} value={g}>Grade {g}</option>)}
      </select>
      <select value={filters.storage ?? ""} onChange={(e) => onChange("storage", e.target.value)} style={sel}>
        <option value="">All storage</option>
        {storages.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={filters.sort ?? ""} onChange={(e) => onChange("sort", e.target.value)} style={sel}>
        <option value="">Newest first</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
      </select>
    </div>
  );
}
