"use client";

import { useOpsAlerts, useLiquidateDevice } from "@/hooks/use-ops";
import { StatusChip } from "@/components/ui/StatusChip";
import Link from "next/link";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

interface ExceptionRow {
  id: string;
  type: string;
  title: string;
  detail: string;
  status: string;
  created_at: string;
}

interface ReviewDevice {
  id: string;
  tag_id: string;
  brand: string;
  model: string;
  storage: string;
  final_grade: string;
  floor_price: number;
  current_price: number;
  listing_id: string | null;
}

export function AlertsClient() {
  const { data, isLoading, error } = useOpsAlerts();
  const liquidate = useLiquidateDevice();

  if (isLoading) return <p>Loading alerts...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const exceptions = ((data as any)?.exceptions ?? []) as ExceptionRow[];
  const reviewDevices = ((data as any)?.reviewDevices ?? []) as ReviewDevice[];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {reviewDevices.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Day-45 Reviews</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "0.5rem" }}>Tag</th>
                <th style={{ padding: "0.5rem" }}>Device</th>
                <th style={{ padding: "0.5rem" }}>Grade</th>
                <th style={{ padding: "0.5rem" }}>Current</th>
                <th style={{ padding: "0.5rem" }}>Floor</th>
                <th style={{ padding: "0.5rem" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {reviewDevices.map(d => (
                <tr key={d.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{d.tag_id}</td>
                  <td style={{ padding: "0.5rem" }}>{d.brand} {d.model} {d.storage}</td>
                  <td style={{ padding: "0.5rem" }}>{d.final_grade}</td>
                  <td style={{ padding: "0.5rem" }}>{inr.format(d.current_price)}</td>
                  <td style={{ padding: "0.5rem" }}>{inr.format(d.floor_price)}</td>
                  <td style={{ padding: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <button
                      onClick={() => {
                        if (!confirm(`Liquidate ${d.tag_id} to B2B at ${inr.format(d.floor_price)}?`)) return;
                        liquidate.mutate({ deviceId: d.id });
                      }}
                      disabled={liquidate.isPending}
                      style={{
                        padding: "0.25rem 0.5rem",
                        fontSize: "0.75rem",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                        background: "#2563eb",
                        color: "#fff",
                      }}
                    >
                      Liquidate to B2B at {inr.format(d.floor_price)}
                    </button>
                    <Link href={`/ops/inventory?status=day45_review`} style={{ fontSize: "0.75rem", color: "#2563eb" }}>
                      View in inventory
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {liquidate.isError && <p style={{ color: "#991b1b", fontSize: "0.75rem" }}>{(liquidate.error as Error).message}</p>}
        </section>
      )}

      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Open Exceptions</h2>
      {exceptions.length === 0 && reviewDevices.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No open alerts.</p>
      ) : exceptions.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No open exceptions.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>Type</th>
              <th style={{ padding: "0.5rem" }}>Title</th>
              <th style={{ padding: "0.5rem" }}>Detail</th>
              <th style={{ padding: "0.5rem" }}>Status</th>
              <th style={{ padding: "0.5rem" }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {exceptions.map(e => (
              <tr key={e.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "0.5rem" }}>{e.type}</td>
                <td style={{ padding: "0.5rem" }}>{e.title}</td>
                <td style={{ padding: "0.5rem", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.detail}</td>
                <td style={{ padding: "0.5rem" }}><StatusChip label={e.status === "open" ? "Open" : "Resolved"} tone={e.status === "open" ? "warning" : "success"} /></td>
                <td style={{ padding: "0.5rem", color: "#6b7280" }}>{new Date(e.created_at).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
