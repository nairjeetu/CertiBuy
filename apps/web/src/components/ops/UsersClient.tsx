"use client";

import { useState } from "react";
import { useOpsUsers } from "@/hooks/use-ops";

interface User {
  id: string;
  full_name: string;
  app_role: string;
  active_mode: string;
  trust_score: number;
  return_count: number;
  account_flagged: boolean;
  hub_id: string | null;
  created_at: string;
}

export function UsersClient() {
  const [role, setRole] = useState("");
  const params = role ? { role } : undefined;
  const { data, isLoading, error } = useOpsUsers(params);

  if (isLoading) return <p>Loading users...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))" }}>{(error as Error).message}</p>;

  const users = (data?.users ?? []) as User[];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Users</h2>
        <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: "0.375rem 0.5rem", borderRadius: "0.75rem", border: "1px solid hsl(var(--border))" }}>
          <option value="">All roles</option>
          <option value="customer">Customer</option>
          <option value="technician">Technician</option>
          <option value="ops">Ops</option>
        </select>
      </div>
      {users.length === 0 ? (
        <p style={{ color: "hsl(var(--muted))" }}>No users found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid hsl(var(--border))", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>Name</th>
              <th style={{ padding: "0.5rem" }}>Role</th>
              <th style={{ padding: "0.5rem" }}>Mode</th>
              <th style={{ padding: "0.5rem" }}>Trust</th>
              <th style={{ padding: "0.5rem" }}>Returns</th>
              <th style={{ padding: "0.5rem" }}>Flagged</th>
              <th style={{ padding: "0.5rem" }}>Hub</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                <td style={{ padding: "0.5rem" }}>{u.full_name}</td>
                <td style={{ padding: "0.5rem" }}>{u.app_role}</td>
                <td style={{ padding: "0.5rem" }}>{u.active_mode}</td>
                <td style={{ padding: "0.5rem" }}>{u.trust_score}</td>
                <td style={{ padding: "0.5rem" }}>{u.return_count}</td>
                <td style={{ padding: "0.5rem" }}>{u.account_flagged ? "Yes" : "No"}</td>
                <td style={{ padding: "0.5rem" }}>{u.hub_id ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
