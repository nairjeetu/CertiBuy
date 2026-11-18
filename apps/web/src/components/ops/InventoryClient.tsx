"use client";

import { useState } from "react";
import { useOpsInventory } from "@/hooks/use-ops";
import { StatusChip } from "@/components/ui/StatusChip";
import { deviceStatuses } from "@certibuy/contracts";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

interface Device {
  id: string;
  imei: string;
  brand: string;
  model: string;
  storage: string;
  final_grade: string | null;
  status: string;
  payout_option: string | null;
  listing_price: number | null;
  listing_status: string | null;
}

const STATUSES = ["", "in_refurbishment", "listed", "day45_review", "reserved", "shipped", "delivered", "settled", "returned", "liquidated"];

export function InventoryClient() {
  const [status, setStatus] = useState("");
  const params = status ? { status } : undefined;
  const { data, isLoading, error } = useOpsInventory(params);

  if (isLoading) return <p>Loading inventory...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const devices = ((data as any)?.devices ?? []) as Device[];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Inventory</h2>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: "0.375rem 0.5rem", border: "1px solid #d1d5db", borderRadius: 4, fontSize: "0.875rem" }}>
          <option value="">All statuses</option>
          {STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{(deviceStatuses as any)[s]?.label ?? s}</option>
          ))}
        </select>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
            <th style={{ padding: "0.5rem" }}>IMEI</th>
            <th style={{ padding: "0.5rem" }}>Device</th>
            <th style={{ padding: "0.5rem" }}>Grade</th>
            <th style={{ padding: "0.5rem" }}>Status</th>
            <th style={{ padding: "0.5rem" }}>Payout</th>
            <th style={{ padding: "0.5rem" }}>Listing price</th>
          </tr>
        </thead>
        <tbody>
          {devices.map(d => {
            const st = (deviceStatuses as any)[d.status];
            return (
              <tr key={d.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{d.imei}</td>
                <td style={{ padding: "0.5rem" }}>{d.brand} {d.model} {d.storage}</td>
                <td style={{ padding: "0.5rem" }}>{d.final_grade ?? "—"}</td>
                <td style={{ padding: "0.5rem" }}>{st ? <StatusChip label={st.label} tone={st.tone} /> : d.status}</td>
                <td style={{ padding: "0.5rem" }}>{d.payout_option ?? "—"}</td>
                <td style={{ padding: "0.5rem" }}>{d.listing_price != null ? inr.format(d.listing_price) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {devices.length === 0 && <p style={{ color: "#6b7280", textAlign: "center", padding: "1rem" }}>No devices found.</p>}
    </div>
  );
}
