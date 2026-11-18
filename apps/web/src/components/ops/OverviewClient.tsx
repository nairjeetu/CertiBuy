"use client";

import { useOpsOverview } from "@/hooks/use-ops";
import Link from "next/link";

const NAV = [
  { href: "/ops/alerts", label: "Alerts" },
  { href: "/ops/catalogue", label: "Catalogue" },
  { href: "/ops/pricing", label: "Pricing" },
  { href: "/ops/liquidity", label: "Liquidity" },
  { href: "/ops/inventory", label: "Inventory" },
  { href: "/ops/exceptions", label: "Exceptions" },
  { href: "/ops/hubs", label: "Hubs" },
  { href: "/ops/users", label: "Users" },
  { href: "/ops/metrics", label: "Metrics" },
  { href: "/ops/demo", label: "Demo" },
  { href: "/ops/jobs", label: "Jobs" },
  { href: "/ops/support", label: "Support" },
  { href: "/ops/audit", label: "Audit log" },
  { href: "/ops/mail", label: "Mail log" },
];

const fmt = new Intl.NumberFormat("en-IN");

interface Activity { id: string; actor_name: string; text: string; business_date: string }

export function OverviewClient() {
  const { data, isLoading, error } = useOpsOverview();
  if (isLoading) return <p>Loading dashboard...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const kpi = (data as any)?.kpi ?? {};
  const activity = ((data as any)?.recentActivity ?? []) as Activity[];
  const cards = [
    { label: "Active listings", value: kpi.activeListings },
    { label: "Pending payouts", value: kpi.pendingPayouts },
    { label: "Open exceptions", value: kpi.openExceptions },
    { label: "Today's bookings", value: kpi.todayBookings },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Operations overview</h2>
      <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>Business date: {(data as any)?.businessDate}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        {cards.map(c => (
          <div key={c.label} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{fmt.format(c.value ?? 0)}</div>
            <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{c.label}</div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Quick links</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {NAV.map(n => (
          <Link key={n.href} href={n.href} style={{ display: "block", border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.5rem 0.75rem", textDecoration: "none", color: "#111827", fontSize: "0.875rem", textAlign: "center" }}>
            {n.label}
          </Link>
        ))}
      </div>

      <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.5rem" }}>Recent activity</h3>
      {activity.length === 0 ? <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>No activity yet.</p> : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {activity.map(a => (
            <li key={a.id} style={{ padding: "0.375rem 0", borderBottom: "1px solid #f3f4f6", fontSize: "0.875rem" }}>
              <strong>{a.actor_name}</strong> {a.text} <span style={{ color: "#9ca3af" }}>({a.business_date})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
