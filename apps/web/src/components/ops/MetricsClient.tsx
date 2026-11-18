"use client";

import { useOpsMetrics, useComputeMetrics } from "@/hooks/use-ops";

const fmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const METRIC_LABELS: Record<string, string> = {
  devices_listed: "Devices listed",
  devices_sold: "Devices sold",
  avg_days_to_sell: "Avg days to sell",
  revenue: "Revenue",
  avg_sale_price: "Avg sale price",
  return_rate: "Return rate (%)",
  payout_success_rate: "Payout success rate (%)",
  active_listings: "Active listings",
  conversion_rate: "Conversion rate (%)",
};

const MONEY_METRICS = new Set(["revenue", "avg_sale_price"]);

interface Week { week_start: string; value: number }

export function MetricsClient() {
  const { data, isLoading, error } = useOpsMetrics();
  const compute = useComputeMetrics();

  if (isLoading) return <p>Loading metrics...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const metrics = (data?.metrics ?? {}) as Record<string, Week[]>;
  const hasData = Object.keys(metrics).length > 0;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Metrics</h2>
        <button onClick={() => compute.mutate()} disabled={compute.isPending} style={{ padding: "0.5rem 1rem", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", opacity: compute.isPending ? 0.6 : 1 }}>
          {compute.isPending ? "Computing..." : "Compute metrics"}
        </button>
      </div>
      {!hasData ? (
        <p style={{ color: "#6b7280" }}>No metric data yet. Click &ldquo;Compute metrics&rdquo; to generate.</p>
      ) : (
        Object.entries(METRIC_LABELS).map(([key, label]) => {
          const weeks = metrics[key] ?? [];
          if (weeks.length === 0) return null;
          return (
            <div key={key} style={{ marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 0.5rem" }}>{label}</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                    {weeks.map(w => <th key={w.week_start} style={{ padding: "0.375rem 0.5rem" }}>{w.week_start}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {weeks.map(w => (
                      <td key={w.week_start} style={{ padding: "0.375rem 0.5rem" }}>
                        {MONEY_METRICS.has(key) ? fmt.format(w.value) : w.value}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}
