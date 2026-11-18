"use client";

import { useOpsJobHistory, useRunDailyJobs } from "@/hooks/use-ops";

interface JobRun {
  id: string;
  job_name: string;
  status: string;
  business_date: string | null;
  last_run_at: string | null;
  counts: Record<string, number>;
  error: string | null;
  updated_at: string;
}

export function JobsClient() {
  const { data, isLoading, error } = useOpsJobHistory();
  const runJob = useRunDailyJobs();

  if (isLoading) return <p>Loading job history...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const jobs = (data?.jobs ?? []) as JobRun[];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Jobs</h2>
        <button onClick={() => runJob.mutate({})} disabled={runJob.isPending} style={{ padding: "0.5rem 1rem", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", opacity: runJob.isPending ? 0.6 : 1 }}>
          {runJob.isPending ? "Running..." : "Run daily job"}
        </button>
      </div>
      {runJob.isSuccess && (
        <p style={{ fontSize: "0.875rem", color: "#16a34a", marginBottom: "0.75rem" }}>
          Job completed for {(runJob.data as { businessDate: string })?.businessDate}.
        </p>
      )}
      {runJob.isError && (
        <p style={{ fontSize: "0.875rem", color: "#991b1b", marginBottom: "0.75rem" }}>
          {(runJob.error as Error).message}
        </p>
      )}
      {jobs.length === 0 ? (
        <p style={{ color: "#6b7280" }}>No job runs yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
              <th style={{ padding: "0.5rem" }}>Job</th>
              <th style={{ padding: "0.5rem" }}>Status</th>
              <th style={{ padding: "0.5rem" }}>Business date</th>
              <th style={{ padding: "0.5rem" }}>Last run</th>
              <th style={{ padding: "0.5rem" }}>Counts</th>
              <th style={{ padding: "0.5rem" }}>Error</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(j => (
              <tr key={j.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "0.5rem", fontWeight: 500 }}>{j.job_name}</td>
                <td style={{ padding: "0.5rem" }}>
                  <span style={{ padding: "0.125rem 0.5rem", borderRadius: 9999, fontSize: "0.75rem", background: j.status === "idle" ? "#dcfce7" : j.status === "failed" ? "#fee2e2" : "#fef3c7", color: j.status === "idle" ? "#166534" : j.status === "failed" ? "#991b1b" : "#92400e" }}>
                    {j.status}
                  </span>
                </td>
                <td style={{ padding: "0.5rem" }}>{j.business_date ?? "—"}</td>
                <td style={{ padding: "0.5rem" }}>{j.last_run_at ? new Date(j.last_run_at).toLocaleString("en-IN") : "—"}</td>
                <td style={{ padding: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem", whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(j.counts, null, 1)}
                </td>
                <td style={{ padding: "0.5rem", color: "#991b1b" }}>{j.error ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
