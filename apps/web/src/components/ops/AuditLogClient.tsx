"use client";

import { useState } from "react";
import { useOpsAuditLog } from "@/hooks/use-ops";

interface LogEntry {
  id: string;
  actor_name: string;
  text: string;
  entity: string;
  entity_id: string;
  business_date: string;
  created_at: string;
}

export function AuditLogClient() {
  const [date, setDate] = useState("");
  const params = date ? { date } : undefined;
  const { data, isLoading, error } = useOpsAuditLog(params);

  if (isLoading) return <p>Loading audit log...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))" }}>{(error as Error).message}</p>;

  const logs = (data?.logs ?? []) as LogEntry[];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Audit log</h2>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: "0.375rem 0.5rem", borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }} />
      </div>
      {logs.length === 0 ? (
        <p style={{ color: "hsl(var(--muted))" }}>No log entries{date ? ` for ${date}` : ""}.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid hsl(var(--border))", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>Actor</th>
              <th style={{ padding: "0.5rem" }}>Action</th>
              <th style={{ padding: "0.5rem" }}>Entity</th>
              <th style={{ padding: "0.5rem" }}>Entity ID</th>
              <th style={{ padding: "0.5rem" }}>Business date</th>
              <th style={{ padding: "0.5rem" }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(l => (
              <tr key={l.id} style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                <td style={{ padding: "0.5rem" }}>{l.actor_name}</td>
                <td style={{ padding: "0.5rem" }}>{l.text}</td>
                <td style={{ padding: "0.5rem" }}>{l.entity}</td>
                <td style={{ padding: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{l.entity_id}</td>
                <td style={{ padding: "0.5rem" }}>{l.business_date}</td>
                <td style={{ padding: "0.5rem" }}>{new Date(l.created_at).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
