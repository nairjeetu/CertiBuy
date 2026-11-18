"use client";

import { useOpsCatalogue, usePauseIcForModel } from "@/hooks/use-ops";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

interface Model {
  id: string;
  brand: string;
  model: string;
  storage: string;
  category: string;
  market_price_a: number;
  liquidity_tier: string;
  liquidity_score: number | null;
  ic_paused: boolean;
  active: boolean;
}

export function CatalogueClient() {
  const { data, isLoading, error } = useOpsCatalogue();
  const pauseIc = usePauseIcForModel();
  if (isLoading) return <p>Loading catalogue...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const models = ((data as any)?.models ?? []) as Model[];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Device catalogue</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
            <th style={{ padding: "0.5rem" }}>Brand</th>
            <th style={{ padding: "0.5rem" }}>Model</th>
            <th style={{ padding: "0.5rem" }}>Storage</th>
            <th style={{ padding: "0.5rem" }}>Category</th>
            <th style={{ padding: "0.5rem" }}>Grade A price</th>
            <th style={{ padding: "0.5rem" }}>Tier</th>
            <th style={{ padding: "0.5rem" }}>Score</th>
            <th style={{ padding: "0.5rem" }}>IC</th>
            <th style={{ padding: "0.5rem" }}>Active</th>
          </tr>
        </thead>
        <tbody>
          {models.map(m => (
            <tr key={m.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "0.5rem" }}>{m.brand}</td>
              <td style={{ padding: "0.5rem" }}>{m.model}</td>
              <td style={{ padding: "0.5rem" }}>{m.storage}</td>
              <td style={{ padding: "0.5rem" }}>{m.category}</td>
              <td style={{ padding: "0.5rem" }}>{inr.format(m.market_price_a)}</td>
              <td style={{ padding: "0.5rem" }}>{m.liquidity_tier}</td>
              <td style={{ padding: "0.5rem" }}>{m.liquidity_score ?? "—"}</td>
              <td style={{ padding: "0.5rem" }}>
                <button
                  onClick={() => pauseIc.mutate({ deviceModelId: m.id, paused: !m.ic_paused })}
                  disabled={pauseIc.isPending}
                  style={{
                    padding: "0.125rem 0.5rem",
                    fontSize: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: 4,
                    cursor: "pointer",
                    background: m.ic_paused ? "#fef2f2" : "#f0fdf4",
                    color: m.ic_paused ? "#991b1b" : "#166534",
                  }}
                >
                  {m.ic_paused ? "Paused" : "On"}
                </button>
              </td>
              <td style={{ padding: "0.5rem" }}>{m.active ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
