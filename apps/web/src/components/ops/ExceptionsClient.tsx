"use client";

import { useState } from "react";
import { useOpsExceptions, useResolveException } from "@/hooks/use-ops";
import { StatusChip } from "@/components/ui/StatusChip";

interface ExceptionRow {
  id: string;
  type: string;
  title: string;
  detail: string;
  status: string;
  resolution: string | null;
  created_at: string;
}

export function ExceptionsClient() {
  const { data, isLoading, error } = useOpsExceptions();
  const resolveMut = useResolveException();
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");

  if (isLoading) return <p>Loading exceptions...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))" }}>{(error as Error).message}</p>;

  const exceptions = ((data as any)?.exceptions ?? []) as ExceptionRow[];

  function handleResolve(id: string) {
    if (!resolution.trim()) return;
    resolveMut.mutate({ exceptionId: id, resolution }, {
      onSuccess: () => { setResolveId(null); setResolution(""); },
    });
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Exceptions</h2>
      {exceptions.length === 0 ? <p style={{ color: "hsl(var(--muted))" }}>No exceptions.</p> : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid hsl(var(--border))", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>Type</th>
              <th style={{ padding: "0.5rem" }}>Title</th>
              <th style={{ padding: "0.5rem" }}>Status</th>
              <th style={{ padding: "0.5rem" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {exceptions.map(e => (
              <tr key={e.id} style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                <td style={{ padding: "0.5rem" }}>{e.type}</td>
                <td style={{ padding: "0.5rem" }}>
                  <div>{e.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted))" }}>{e.detail}</div>
                </td>
                <td style={{ padding: "0.5rem" }}>
                  <StatusChip label={e.status === "open" ? "Open" : "Resolved"} tone={e.status === "open" ? "warning" : "success"} />
                </td>
                <td style={{ padding: "0.5rem" }}>
                  {e.status === "open" ? (
                    resolveId === e.id ? (
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        <input value={resolution} onChange={ev => setResolution(ev.target.value)} placeholder="Resolution" style={{ padding: "0.25rem", border: "1px solid hsl(var(--border))", borderRadius: 4, fontSize: "0.75rem", width: 160 }} />
                        <button onClick={() => handleResolve(e.id)} disabled={resolveMut.isPending} style={{ padding: "0.25rem 0.5rem", background: "#16a34a", color: "hsl(var(--primary-foreground))", border: "none", borderRadius: 4, fontSize: "0.75rem", cursor: "pointer" }}>
                          {resolveMut.isPending ? "..." : "Save"}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setResolveId(e.id)} style={{ padding: "0.25rem 0.5rem", background: "#2563eb", color: "hsl(var(--primary-foreground))", border: "none", borderRadius: 4, fontSize: "0.75rem", cursor: "pointer" }}>Resolve</button>
                    )
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted))" }}>{e.resolution}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
