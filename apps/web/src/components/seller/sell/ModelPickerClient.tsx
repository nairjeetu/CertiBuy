"use client";

import { useDeviceCatalogue } from "@/hooks/use-seller";
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

  if (isLoading) return <p>Loading catalogue...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

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
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Choose your device</h2>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", margin: "1rem 0" }}>
        <button
          onClick={() => setCategory("all")}
          style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", border: "1px solid #d1d5db", backgroundColor: category === "all" ? "#2563eb" : "#fff", color: category === "all" ? "#fff" : "#374151", cursor: "pointer", fontSize: "0.8125rem" }}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", border: "1px solid #d1d5db", backgroundColor: category === c ? "#2563eb" : "#fff", color: category === c ? "#fff" : "#374151", cursor: "pointer", fontSize: "0.8125rem", textTransform: "capitalize" }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <button
          onClick={() => setBrand("all")}
          style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", border: "1px solid #e5e7eb", backgroundColor: brand === "all" ? "#1e40af" : "#f9fafb", color: brand === "all" ? "#fff" : "#374151", cursor: "pointer", fontSize: "0.75rem" }}
        >
          All brands
        </button>
        {brands.map((b) => (
          <button
            key={b}
            onClick={() => setBrand(b)}
            style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", border: "1px solid #e5e7eb", backgroundColor: brand === b ? "#1e40af" : "#f9fafb", color: brand === b ? "#fff" : "#374151", cursor: "pointer", fontSize: "0.75rem" }}
          >
            {b}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Search models..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", padding: "0.5rem 0.75rem", border: "1px solid #d1d5db", borderRadius: "0.375rem", fontSize: "0.875rem", marginBottom: "1rem", boxSizing: "border-box" }}
      />

      {filtered.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No models match your search.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => handleSelect(m)}
              disabled={!m.inPriceBand}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.75rem 1rem",
                border: "1px solid #e5e7eb",
                borderRadius: "0.5rem",
                backgroundColor: m.inPriceBand ? "#fff" : "#f9fafb",
                cursor: m.inPriceBand ? "pointer" : "not-allowed",
                opacity: m.inPriceBand ? 1 : 0.6,
                textAlign: "left",
                width: "100%",
              }}
            >
              <div>
                <div style={{ fontWeight: 500 }}>
                  {m.brand} {m.model}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  {m.storage} · {m.category}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>
                  {formatINR(m.marketPriceA)}
                </div>
                {!m.inPriceBand && (
                  <div style={{ fontSize: "0.6875rem", color: "#991b1b" }}>
                    {m.priceBandReason}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
