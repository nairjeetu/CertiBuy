"use client";

import { useState } from "react";
import { useOpsSupportInbox } from "@/hooks/use-ops";

interface SupportReq {
  id: string;
  customer_id: string;
  topic: string;
  message: string;
  status: string;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export function SupportClient() {
  const [status, setStatus] = useState("");
  const params = status ? { status } : undefined;
  const { data, isLoading, error } = useOpsSupportInbox(params);

  if (isLoading) return <p>Loading support inbox...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const requests = (data?.requests ?? []) as SupportReq[];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Support inbox</h2>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: "0.375rem 0.5rem", borderRadius: 6, border: "1px solid #d1d5db" }}>
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="replied">Replied</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>
      {requests.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No support requests.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>Topic</th>
              <th style={{ padding: "0.5rem" }}>Message</th>
              <th style={{ padding: "0.5rem" }}>Status</th>
              <th style={{ padding: "0.5rem" }}>Reply</th>
              <th style={{ padding: "0.5rem" }}>Replied at</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "0.5rem" }}>{r.topic}</td>
                <td style={{ padding: "0.5rem", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.message}</td>
                <td style={{ padding: "0.5rem" }}>{r.status}</td>
                <td style={{ padding: "0.5rem" }}>{r.reply ?? "—"}</td>
                <td style={{ padding: "0.5rem" }}>{r.replied_at ? new Date(r.replied_at).toLocaleString("en-IN") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
