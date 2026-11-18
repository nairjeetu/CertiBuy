"use client";

import { useState } from "react";
import { useOpsDemoControls, useAdvanceDemoClock, useTogglePayoutFailure } from "@/hooks/use-ops";

export function DemoClient() {
  const { data, isLoading, error } = useOpsDemoControls();
  const advanceClock = useAdvanceDemoClock();
  const toggleFailure = useTogglePayoutFailure();
  const [days, setDays] = useState(1);

  if (isLoading) return <p>Loading demo controls...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const demoMode = data?.demo_mode as boolean;
  const offset = data?.sim_day_offset as number;
  const payoutFailure = data?.simulate_payout_failure as boolean;
  const bizDate = data?.businessDate as string;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Demo controls</h2>

      <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: "1rem" }}>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.875rem", color: "#6b7280" }}>Demo mode: <strong>{demoMode ? "On" : "Off"}</strong></p>
        <p style={{ margin: "0 0 0.5rem", fontSize: "0.875rem" }}>Business date: <strong>{bizDate}</strong></p>
        <p style={{ margin: "0 0 1rem", fontSize: "0.875rem" }}>Day offset: <strong>{offset}</strong></p>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.875rem" }}>Advance by</label>
          <input type="number" min={1} max={30} value={days} onChange={e => setDays(Number(e.target.value))} style={{ width: 60, padding: "0.375rem", borderRadius: 6, border: "1px solid #d1d5db", textAlign: "center" }} />
          <span style={{ fontSize: "0.875rem" }}>days</span>
          <button onClick={() => advanceClock.mutate({ days })} disabled={advanceClock.isPending || !demoMode} style={{ padding: "0.5rem 1rem", borderRadius: 6, background: "#2563eb", color: "#fff", border: "none", cursor: "pointer", opacity: advanceClock.isPending || !demoMode ? 0.6 : 1 }}>
            {advanceClock.isPending ? "Advancing..." : "Advance clock"}
          </button>
        </div>
        {advanceClock.isSuccess && (
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#16a34a" }}>
            Clock advanced. New offset: {(advanceClock.data as { newOffset: number })?.newOffset}
          </p>
        )}
        {advanceClock.isError && (
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#991b1b" }}>
            {(advanceClock.error as Error).message}
          </p>
        )}
      </div>

      <div style={{ padding: "1rem", border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }}>
          <input type="checkbox" checked={payoutFailure} onChange={e => toggleFailure.mutate({ enabled: e.target.checked })} />
          Simulate payout failure
        </label>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "#6b7280" }}>
          When enabled, all payout attempts in the daily job will fail.
        </p>
      </div>
    </div>
  );
}
