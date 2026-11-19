"use client";

import { useState } from "react";
import { useOpsPricing, useUpdateSettings } from "@/hooks/use-ops";

const GROUPS: Record<string, string[]> = {
  "Fees (₹)": ["commission_pct", "inspection_fee", "mismatch_fee", "return_logistics_charge", "change_mind_fee", "cancel_fee", "hub_cost"],
  "Warranty & Payout": ["warranty_months", "warranty_addon_pct", "advance_pct", "balance_day", "payout_max_attempts"],
  "Ladder / Timing": ["step1_day", "step1_pct", "step2_day", "step2_pct", "review_day", "alert_window_days", "return_window_days", "offer_expiry_days", "checkout_hold_minutes"],
  "Grading": ["grade_factor_b", "grade_factor_c", "grade_factor_d", "battery_a_min", "battery_b_min", "battery_c_min", "photo_retake_medium", "photo_min_px", "photo_min_brightness"],
  "Liquidity Weights": ["liq_w_days", "liq_w_demand", "liq_w_volatility", "liq_w_launch", "liq_review_penalty", "liquidity_threshold", "near_band", "launch_window_days", "launch_tighten_pts"],
  "Risk & Caps": ["risk_small_pct", "risk_large_pct", "inventory_cap", "per_model_cap", "price_band_min", "price_band_max"],
};

export function PricingClient() {
  const { data, isLoading, error } = useOpsPricing();
  const updateMut = useUpdateSettings();
  const [edits, setEdits] = useState<Record<string, number>>({});

  if (isLoading) return <p>Loading settings...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))" }}>{(error as Error).message}</p>;

  const settings = (data as any)?.settings ?? {};

  function handleChange(key: string, raw: string) {
    const val = raw.includes(".") ? parseFloat(raw) : parseInt(raw, 10);
    if (!isNaN(val)) setEdits(prev => ({ ...prev, [key]: val }));
  }

  function handleSave() {
    if (Object.keys(edits).length === 0) return;
    updateMut.mutate(edits, { onSuccess: () => setEdits({}) });
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Pricing and settings</h2>
        <button onClick={handleSave} disabled={updateMut.isPending || Object.keys(edits).length === 0} style={{ padding: "0.5rem 1rem", background: "#2563eb", color: "hsl(var(--primary-foreground))", border: "none", borderRadius: "0.75rem", cursor: "pointer", opacity: Object.keys(edits).length === 0 ? 0.5 : 1 }}>
          {updateMut.isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
      <p style={{ fontSize: "0.75rem", color: "hsl(var(--muted))", marginBottom: "1rem" }}>Version: {settings.version}</p>

      {Object.entries(GROUPS).map(([group, keys]) => (
        <div key={group} style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 600, borderBottom: "1px solid hsl(var(--border))", paddingBottom: "0.25rem", marginBottom: "0.5rem" }}>{group}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
            {keys.map(k => (
              <label key={k} style={{ fontSize: "0.75rem" }}>
                <span style={{ color: "hsl(var(--muted))" }}>{k}</span>
                <input type="number" step={k.startsWith("grade_factor") ? 0.01 : 1} defaultValue={settings[k] ?? 0} onChange={e => handleChange(k, e.target.value)} style={{ display: "block", width: "100%", padding: "0.25rem 0.5rem", border: "1px solid hsl(var(--border))", borderRadius: 4, marginTop: 2 }} />
              </label>
            ))}
          </div>
        </div>
      ))}

      {updateMut.isError && <p style={{ color: "hsl(var(--destructive))", fontSize: "0.875rem" }}>{(updateMut.error as Error).message}</p>}
      {updateMut.isSuccess && <p style={{ color: "hsl(var(--success))", fontSize: "0.875rem" }}>Settings saved.</p>}
    </div>
  );
}
