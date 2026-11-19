"use client";

import { useState } from "react";
import {
  useOpsInventory,
  useMarkRefurbished,
  useLiquidateDevice,
  useRepriceListing,
  useSetOverridePrice,
} from "@/hooks/use-ops";
import { StatusChip } from "@/components/ui/StatusChip";
import { deviceStatuses } from "@certibuy/contracts";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

interface Device {
  id: string;
  imei: string;
  tag_id: string;
  brand: string;
  model: string;
  storage: string;
  final_grade: string | null;
  status: string;
  payout_option: string | null;
  acquisition_cost: number;
  parts_replaced: string[];
  device_model_id: string;
  listing_id: string | null;
  listing_price: number | null;
  listing_base_price: number | null;
  listing_floor_price: number | null;
  listing_override_price: number | null;
  listing_listed_at: string | null;
  listing_warranty_months: number | null;
  listing_ladder_step: number | null;
  listing_status: string | null;
  b2b_floor_price: number;
}

const STATUSES = ["", "in_refurbishment", "listed", "day45_review", "reserved", "shipped", "delivered", "settled", "returned", "liquidated"];

export function InventoryClient() {
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const params = status ? { status } : undefined;
  const { data, isLoading, error } = useOpsInventory(params);

  if (isLoading) return <p>Loading inventory...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))" }}>{(error as Error).message}</p>;

  const devices = ((data as any)?.devices ?? []) as Device[];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Inventory</h2>
        <select value={status} onChange={e => { setStatus(e.target.value); setSelected(null); }} style={{ padding: "0.375rem 0.5rem", border: "1px solid hsl(var(--border))", borderRadius: 4, fontSize: "0.875rem" }}>
          <option value="">All statuses</option>
          {STATUSES.filter(Boolean).map(s => (
            <option key={s} value={s}>{(deviceStatuses as any)[s]?.label ?? s}</option>
          ))}
        </select>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid hsl(var(--border))", textAlign: "left" }}>
            <th style={{ padding: "0.5rem" }}>Tag</th>
            <th style={{ padding: "0.5rem" }}>Device</th>
            <th style={{ padding: "0.5rem" }}>Grade</th>
            <th style={{ padding: "0.5rem" }}>Status</th>
            <th style={{ padding: "0.5rem" }}>Acq. cost</th>
            <th style={{ padding: "0.5rem" }}>Listing price</th>
          </tr>
        </thead>
        <tbody>
          {devices.map(d => {
            const st = (deviceStatuses as any)[d.status];
            const isSelected = selected === d.id;
            return (
              <DeviceRow
                key={d.id}
                device={d}
                st={st}
                isSelected={isSelected}
                onToggle={() => setSelected(isSelected ? null : d.id)}
              />
            );
          })}
        </tbody>
      </table>
      {devices.length === 0 && <p style={{ color: "hsl(var(--muted))", textAlign: "center", padding: "1rem" }}>No devices found.</p>}
    </div>
  );
}

function DeviceRow({ device: d, st, isSelected, onToggle }: {
  device: Device;
  st: { label: string; tone: string } | undefined;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        style={{ borderBottom: "1px solid hsl(var(--border))", cursor: "pointer", background: isSelected ? "#f0f9ff" : undefined }}
      >
        <td style={{ padding: "0.5rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{d.tag_id}</td>
        <td style={{ padding: "0.5rem" }}>{d.brand} {d.model} {d.storage}</td>
        <td style={{ padding: "0.5rem" }}>{d.final_grade ?? "—"}</td>
        <td style={{ padding: "0.5rem" }}>{st ? <StatusChip label={st.label} tone={st.tone} /> : d.status}</td>
        <td style={{ padding: "0.5rem" }}>{inr.format(d.acquisition_cost)}</td>
        <td style={{ padding: "0.5rem" }}>{d.listing_price != null ? inr.format(d.listing_price) : "—"}</td>
      </tr>
      {isSelected && (
        <tr>
          <td colSpan={6} style={{ padding: "0.75rem 0.5rem", background: "hsl(var(--secondary))", borderBottom: "2px solid hsl(var(--border))" }}>
            <DeviceDetail device={d} />
          </td>
        </tr>
      )}
    </>
  );
}

function DeviceDetail({ device: d }: { device: Device }) {
  return (
    <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
      <div style={{ minWidth: 220 }}>
        <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.8125rem", fontWeight: 600, color: "hsl(var(--foreground))" }}>Device</h4>
        <dl style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.8 }}>
          <dt style={{ color: "hsl(var(--muted))", display: "inline" }}>IMEI: </dt><dd style={{ display: "inline", margin: 0 }}>{d.imei}</dd><br />
          <dt style={{ color: "hsl(var(--muted))", display: "inline" }}>Tag: </dt><dd style={{ display: "inline", margin: 0 }}>{d.tag_id}</dd><br />
          <dt style={{ color: "hsl(var(--muted))", display: "inline" }}>Grade: </dt><dd style={{ display: "inline", margin: 0 }}>{d.final_grade}</dd><br />
          {d.parts_replaced.length > 0 && (
            <><dt style={{ color: "hsl(var(--muted))", display: "inline" }}>Parts replaced: </dt><dd style={{ display: "inline", margin: 0 }}>{d.parts_replaced.join(", ")}</dd><br /></>
          )}
        </dl>
      </div>
      {d.listing_id && (
        <div style={{ minWidth: 220 }}>
          <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.8125rem", fontWeight: 600, color: "hsl(var(--foreground))" }}>Listing</h4>
          <dl style={{ margin: 0, fontSize: "0.8125rem", lineHeight: 1.8 }}>
            <dt style={{ color: "hsl(var(--muted))", display: "inline" }}>Base: </dt><dd style={{ display: "inline", margin: 0 }}>{inr.format(d.listing_base_price!)}</dd><br />
            <dt style={{ color: "hsl(var(--muted))", display: "inline" }}>Current: </dt><dd style={{ display: "inline", margin: 0 }}>{inr.format(d.listing_price!)}</dd><br />
            <dt style={{ color: "hsl(var(--muted))", display: "inline" }}>Floor: </dt><dd style={{ display: "inline", margin: 0 }}>{inr.format(d.listing_floor_price!)}</dd><br />
            {d.listing_override_price != null && (
              <><dt style={{ color: "hsl(var(--muted))", display: "inline" }}>Override: </dt><dd style={{ display: "inline", margin: 0 }}>{inr.format(d.listing_override_price)}</dd><br /></>
            )}
            <dt style={{ color: "hsl(var(--muted))", display: "inline" }}>Ladder step: </dt><dd style={{ display: "inline", margin: 0 }}>{d.listing_ladder_step}</dd><br />
            <dt style={{ color: "hsl(var(--muted))", display: "inline" }}>Warranty: </dt><dd style={{ display: "inline", margin: 0 }}>{d.listing_warranty_months} months</dd><br />
            <dt style={{ color: "hsl(var(--muted))", display: "inline" }}>Listed: </dt><dd style={{ display: "inline", margin: 0 }}>{d.listing_listed_at}</dd><br />
          </dl>
        </div>
      )}
      <div style={{ minWidth: 220 }}>
        <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.8125rem", fontWeight: 600, color: "hsl(var(--foreground))" }}>Actions</h4>
        <ActionPanel device={d} />
      </div>
    </div>
  );
}

function ActionPanel({ device: d }: { device: Device }) {
  const markRefurbished = useMarkRefurbished();
  const liquidate = useLiquidateDevice();
  const reprice = useRepriceListing();
  const setOverride = useSetOverridePrice();
  const [parts, setParts] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [overridePrice, setOverridePrice] = useState("");

  const btnStyle = (primary?: boolean) => ({
    padding: "0.375rem 0.75rem",
    fontSize: "0.8125rem",
    border: primary ? "none" : "1px solid hsl(var(--border))",
    borderRadius: 4,
    cursor: "pointer" as const,
    background: primary ? "#2563eb" : "#fff",
    color: primary ? "#fff" : "hsl(var(--foreground))",
  });

  if (d.status === "in_refurbishment") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <input
          type="text"
          placeholder="Parts replaced (comma-separated)"
          value={parts}
          onChange={e => setParts(e.target.value)}
          style={{ padding: "0.375rem 0.5rem", border: "1px solid hsl(var(--border))", borderRadius: 4, fontSize: "0.8125rem" }}
        />
        <button
          style={btnStyle(true)}
          disabled={markRefurbished.isPending}
          onClick={() => {
            if (!confirm("Mark this device as refurbished and list it with no warranty?")) return;
            markRefurbished.mutate({
              deviceId: d.id,
              partsReplaced: parts.split(",").map(s => s.trim()).filter(Boolean),
            });
          }}
        >
          {markRefurbished.isPending ? "Listing..." : "Mark refurbished and list"}
        </button>
        {markRefurbished.isError && <p style={{ color: "hsl(var(--destructive))", margin: 0, fontSize: "0.75rem" }}>{(markRefurbished.error as Error).message}</p>}
      </div>
    );
  }

  if (d.status === "day45_review" && d.listing_status === "review") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <button
          style={btnStyle(true)}
          disabled={liquidate.isPending}
          onClick={() => {
            if (!confirm(`Liquidate to B2B at floor ${inr.format(d.listing_floor_price!)}?`)) return;
            liquidate.mutate({ deviceId: d.id });
          }}
        >
          {liquidate.isPending ? "Liquidating..." : `Liquidate to B2B at ${inr.format(d.listing_floor_price!)}`}
        </button>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="number"
            placeholder={`Reprice (min ${d.listing_floor_price})`}
            value={newPrice}
            onChange={e => setNewPrice(e.target.value)}
            style={{ padding: "0.375rem 0.5rem", border: "1px solid hsl(var(--border))", borderRadius: 4, fontSize: "0.8125rem", width: 140 }}
          />
          <button
            style={btnStyle()}
            disabled={reprice.isPending || !newPrice}
            onClick={() => {
              if (!d.listing_id) return;
              if (!confirm(`Reprice listing to ₹${Number(newPrice).toLocaleString("en-IN")}?`)) return;
              reprice.mutate({ listingId: d.listing_id, newPrice: Number(newPrice) });
            }}
          >
            Reprice
          </button>
        </div>
        {liquidate.isError && <p style={{ color: "hsl(var(--destructive))", margin: 0, fontSize: "0.75rem" }}>{(liquidate.error as Error).message}</p>}
        {reprice.isError && <p style={{ color: "hsl(var(--destructive))", margin: 0, fontSize: "0.75rem" }}>{(reprice.error as Error).message}</p>}
      </div>
    );
  }

  if (d.status === "listed" && d.listing_status === "active" && d.listing_id) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="number"
            placeholder={`Reprice (min ${d.listing_floor_price})`}
            value={newPrice}
            onChange={e => setNewPrice(e.target.value)}
            style={{ padding: "0.375rem 0.5rem", border: "1px solid hsl(var(--border))", borderRadius: 4, fontSize: "0.8125rem", width: 140 }}
          />
          <button
            style={btnStyle(true)}
            disabled={reprice.isPending || !newPrice}
            onClick={() => {
              if (!confirm(`Reprice listing to ₹${Number(newPrice).toLocaleString("en-IN")}?`)) return;
              reprice.mutate({ listingId: d.listing_id!, newPrice: Number(newPrice) });
            }}
          >
            Reprice
          </button>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="number"
            placeholder={`Override (min ${d.listing_floor_price})`}
            value={overridePrice}
            onChange={e => setOverridePrice(e.target.value)}
            style={{ padding: "0.375rem 0.5rem", border: "1px solid hsl(var(--border))", borderRadius: 4, fontSize: "0.8125rem", width: 140 }}
          />
          <button
            style={btnStyle()}
            disabled={setOverride.isPending || !overridePrice}
            onClick={() => {
              if (!confirm(`Set override to ₹${Number(overridePrice).toLocaleString("en-IN")}?`)) return;
              setOverride.mutate({ listingId: d.listing_id!, overridePrice: Number(overridePrice) });
            }}
          >
            Set override
          </button>
          {d.listing_override_price != null && (
            <button
              style={btnStyle()}
              disabled={setOverride.isPending}
              onClick={() => {
                if (!confirm("Clear override price?")) return;
                setOverride.mutate({ listingId: d.listing_id!, overridePrice: null });
              }}
            >
              Clear override
            </button>
          )}
        </div>
        {reprice.isError && <p style={{ color: "hsl(var(--destructive))", margin: 0, fontSize: "0.75rem" }}>{(reprice.error as Error).message}</p>}
        {setOverride.isError && <p style={{ color: "hsl(var(--destructive))", margin: 0, fontSize: "0.75rem" }}>{(setOverride.error as Error).message}</p>}
      </div>
    );
  }

  return <p style={{ color: "hsl(var(--muted))", margin: 0, fontSize: "0.8125rem" }}>No actions available for this status.</p>;
}
