"use client";

import { useOpsHubs } from "@/hooks/use-ops";

interface Hub {
  id: string;
  name: string;
  type: string;
  city: string;
  daily_capacity: number;
  todayBookings: number;
}

export function HubsClient() {
  const { data, isLoading, error } = useOpsHubs();
  if (isLoading) return <p>Loading hubs...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const hubs = ((data as any)?.hubs ?? []) as Hub[];

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Hubs</h2>
      {hubs.length === 0 ? <p style={{ color: "#6b7280" }}>No hubs configured.</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>Name</th>
              <th style={{ padding: "0.5rem" }}>Type</th>
              <th style={{ padding: "0.5rem" }}>City</th>
              <th style={{ padding: "0.5rem" }}>Daily capacity</th>
              <th style={{ padding: "0.5rem" }}>Today's bookings</th>
            </tr>
          </thead>
          <tbody>
            {hubs.map(h => (
              <tr key={h.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "0.5rem", fontWeight: 500 }}>{h.name}</td>
                <td style={{ padding: "0.5rem" }}>{h.type}</td>
                <td style={{ padding: "0.5rem" }}>{h.city}</td>
                <td style={{ padding: "0.5rem" }}>{h.daily_capacity}</td>
                <td style={{ padding: "0.5rem" }}>{h.todayBookings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
