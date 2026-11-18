"use client";

import { useOpsMailLog } from "@/hooks/use-ops";

interface Notif {
  id: string;
  user_id: string;
  event: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export function MailLogClient() {
  const { data, isLoading, error } = useOpsMailLog();

  if (isLoading) return <p>Loading mail log...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const notifications = (data?.notifications ?? []) as Notif[];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Mail / notification log</h2>
      {notifications.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No notifications sent yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>User</th>
              <th style={{ padding: "0.5rem" }}>Event</th>
              <th style={{ padding: "0.5rem" }}>Title</th>
              <th style={{ padding: "0.5rem" }}>Body</th>
              <th style={{ padding: "0.5rem" }}>Read</th>
              <th style={{ padding: "0.5rem" }}>Sent</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map(n => (
              <tr key={n.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{n.user_id.slice(0, 8)}...</td>
                <td style={{ padding: "0.5rem" }}>{n.event}</td>
                <td style={{ padding: "0.5rem" }}>{n.title}</td>
                <td style={{ padding: "0.5rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</td>
                <td style={{ padding: "0.5rem" }}>{n.read ? "Yes" : "No"}</td>
                <td style={{ padding: "0.5rem" }}>{new Date(n.created_at).toLocaleString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
