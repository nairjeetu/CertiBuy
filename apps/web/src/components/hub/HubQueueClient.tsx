"use client";

import { useHubQueue } from "@/hooks/use-hub";
import { StatusChip } from "@/components/ui/StatusChip";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface QueueJob {
  bookingId: string;
  submissionId: string;
  slot: string;
  status: string;
  statusLabel: string;
  seller: { name: string; phone: string };
  model: { brand: string; name: string; storage: string };
  aiBand: string[];
  confidence: string;
  identityPassed: boolean;
  gradeSealed: boolean;
  verdict: string | null;
}

export function HubQueueClient() {
  const [date, setDate] = useState<string | undefined>();
  const { data, isLoading, error } = useHubQueue(date);
  const router = useRouter();

  if (isLoading) return <p>Loading queue...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))" }}>{(error as Error).message}</p>;

  const queue = data as unknown as {
    hub: { id: string; name: string; city: string } | null;
    today: string;
    date: string;
    days: string[];
    jobs: QueueJob[];
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem" }}>
        {queue.hub ? `${queue.hub.name} — ${queue.hub.city}` : "Hub queue"}
      </h2>

      <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1rem", overflowX: "auto" }}>
        {queue.days.map((d) => (
          <button
            key={d}
            onClick={() => setDate(d === queue.today ? undefined : d)}
            style={{
              padding: "0.375rem 0.75rem",
              border: (date ?? queue.today) === d ? "2px solid #2563eb" : "1px solid hsl(var(--border))",
              borderRadius: "0.375rem",
              backgroundColor: (date ?? queue.today) === d ? "hsl(var(--primary) / 0.04)" : "#fff",
              cursor: "pointer",
              fontSize: "0.8125rem",
              whiteSpace: "nowrap",
            }}
          >
            {d === queue.today ? "Today" : d.slice(5)}
          </button>
        ))}
      </div>

      {queue.jobs.length === 0 && (
        <p style={{ color: "hsl(var(--muted))", fontSize: "0.875rem" }}>No bookings for this day.</p>
      )}

      {queue.jobs.map((job) => (
        <button
          key={job.bookingId}
          onClick={() => router.push(`/hub/${job.submissionId}`)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "0.75rem",
            marginBottom: "0.5rem",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
            backgroundColor: "#fff",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div>
            <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>
              {job.model.brand} {job.model.name} {job.model.storage}
            </div>
            <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted))" }}>
              {job.slot} · {job.seller.name}
            </div>
            <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted))", marginTop: "0.125rem" }}>
              AI: {job.aiBand.join("–") || "—"} · {job.confidence}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
            <StatusChip label={job.statusLabel} tone={job.identityPassed && job.gradeSealed ? "success" : "neutral"} />
            {job.verdict && (
              <span style={{ fontSize: "0.6875rem", color: job.verdict === "inside" ? "#16a34a" : "#dc2626" }}>
                {job.verdict.replace("_", " ")}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
