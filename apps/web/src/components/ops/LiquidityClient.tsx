"use client";

import { useOpsLiquidity, useRecalcLiquidity } from "@/hooks/use-ops";

interface Model {
  id: string;
  brand: string;
  model: string;
  storage: string;
  liquidity_tier: string;
  score: number | null;
  days_to_sell: number | null;
  volatility: number | null;
  source: string | null;
}

export function LiquidityClient() {
  const { data, isLoading, error } = useOpsLiquidity();
  const recalc = useRecalcLiquidity();

  if (isLoading) return <p>Loading liquidity board...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const models = ((data as any)?.models ?? []) as Model[];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Liquidity board</h2>
        <button onClick={() => recalc.mutate()} disabled={recalc.isPending} style={{ padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
          {recalc.isPending ? "Recalculating..." : "Recalculate"}
        </button>
      </div>

      {recalc.isSuccess && <p style={{ color: "#16a34a", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Liquidity scores updated.</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
            <th style={{ padding: "0.5rem" }}>Brand</th>
            <th style={{ padding: "0.5rem" }}>Model</th>
            <th style={{ padding: "0.5rem" }}>Storage</th>
            <th style={{ padding: "0.5rem" }}>Tier</th>
            <th style={{ padding: "0.5rem" }}>Score</th>
            <th style={{ padding: "0.5rem" }}>Avg days</th>
            <th style={{ padding: "0.5rem" }}>Volatility</th>
            <th style={{ padding: "0.5rem" }}>Source</th>
          </tr>
        </thead>
        <tbody>
          {models.map(m => (
            <tr key={m.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "0.5rem" }}>{m.brand}</td>
              <td style={{ padding: "0.5rem" }}>{m.model}</td>
              <td style={{ padding: "0.5rem" }}>{m.storage}</td>
              <td style={{ padding: "0.5rem" }}>{m.liquidity_tier}</td>
              <td style={{ padding: "0.5rem", fontWeight: 600 }}>{m.score ?? "—"}</td>
              <td style={{ padding: "0.5rem" }}>{m.days_to_sell ?? "—"}</td>
              <td style={{ padding: "0.5rem" }}>{m.volatility != null ? `${m.volatility.toFixed(1)}%` : "—"}</td>
              <td style={{ padding: "0.5rem", color: "#6b7280" }}>{m.source ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
