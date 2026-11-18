"use client";

import { useOpsAlerts } from "@/hooks/use-ops";
import { StatusChip } from "@/components/ui/StatusChip";

interface ExceptionRow {
  id: string;
  type: string;
  title: string;
  detail: string;
  status: string;
  created_at: string;
}

export function AlertsClient() {
  const { data, isLoading, error } = useOpsAlerts();
  if (isLoading) return <p>Loading alerts...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const exceptions = ((data as any)?.exceptions ?? []) as ExceptionRow[];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Alerts</h2>
      {exceptions.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No open alerts.</p>
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
