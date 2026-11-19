"use client";

import { useOpsOverview } from "@/hooks/use-ops";
import Link from "next/link";

const NAV = [
  { href: "/ops/alerts", label: "Alerts", icon: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" },
  { href: "/ops/catalogue", label: "Catalogue", icon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20" },
  { href: "/ops/pricing", label: "Pricing", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  { href: "/ops/liquidity", label: "Liquidity", icon: "M18 20V10M12 20V4M6 20v-6" },
  { href: "/ops/inventory", label: "Inventory", icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" },
  { href: "/ops/exceptions", label: "Exceptions", icon: "M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" },
  { href: "/ops/hubs", label: "Hubs", icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { href: "/ops/users", label: "Users", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" },
  { href: "/ops/metrics", label: "Metrics", icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
  { href: "/ops/demo", label: "Demo", icon: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" },
  { href: "/ops/jobs", label: "Jobs", icon: "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.49 8.49l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.49-8.49l2.83-2.83" },
  { href: "/ops/support", label: "Support", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { href: "/ops/audit", label: "Audit log", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
  { href: "/ops/mail", label: "Mail log", icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" },
];

const fmt = new Intl.NumberFormat("en-IN");

interface Activity { id: string; actor_name: string; text: string; entity?: string; entity_id?: string; business_date: string }

export function OverviewClient() {
  const { data, isLoading, error } = useOpsOverview();
  if (isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading dashboard...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))", padding: "1rem" }}>{(error as Error).message}</p>;

  const kpi = (data as Record<string, unknown>)?.kpi as Record<string, number> | undefined ?? {};
  const activity = ((data as Record<string, unknown>)?.recentActivity ?? []) as Activity[];
  const bizDate = (data as Record<string, unknown>)?.businessDate as string;

  const primaryCards = [
    { label: "Active listings", value: kpi.activeListings, href: "/ops/inventory", color: "var(--primary)" },
    { label: "Devices in custody", value: kpi.totalDevices, href: "/ops/inventory", color: "var(--primary)" },
    { label: "Active orders", value: kpi.activeOrders, href: "/ops/inventory", color: "var(--success)" },
    { label: "Reserved", value: kpi.reservedListings, href: "/ops/inventory", color: "var(--warning)" },
  ];

  const secondaryCards = [
    { label: "Pending payouts", value: kpi.pendingPayouts, href: "/ops/exceptions" },
    { label: "Open exceptions", value: kpi.openExceptions, href: "/ops/exceptions" },
    { label: "Pending returns", value: kpi.pendingReturns, href: "/ops/exceptions" },
    { label: "Today's bookings", value: kpi.todayBookings, href: "/ops/hubs" },
    { label: "Total submissions", value: kpi.totalSubmissions, href: "/ops/inventory" },
    { label: "Registered users", value: kpi.registeredUsers, href: "/ops/users" },
    { label: "Active hubs", value: kpi.hubCount, href: "/ops/hubs" },
    { label: "Catalogue models", value: kpi.catalogueModels, href: "/ops/catalogue" },
  ];

  return (
    <div className="ops-overview">
      <div className="ops-header">
        <div>
          <h2 className="ops-title">Operations overview</h2>
          <p className="ops-date">Business date: {bizDate}</p>
        </div>
      </div>

      {/* Primary KPI row */}
      <div className="kpi-primary">
        {primaryCards.map(c => (
          <Link key={c.label} href={c.href} className="kpi-card-primary surface" style={{ textDecoration: "none" }}>
            <span className="kpi-num-primary" style={{ color: `hsl(${c.color})` }}>{fmt.format(c.value ?? 0)}</span>
            <span className="kpi-label">{c.label}</span>
          </Link>
        ))}
      </div>

      {/* Secondary KPI grid */}
      <div className="kpi-secondary">
        {secondaryCards.map(c => (
          <Link key={c.label} href={c.href} className="kpi-card-secondary surface" style={{ textDecoration: "none" }}>
            <span className="kpi-num-secondary">{fmt.format(c.value ?? 0)}</span>
            <span className="kpi-label-sm">{c.label}</span>
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <h3 className="section-title">Quick links</h3>
      <div className="quick-links">
        {NAV.map(n => (
          <Link key={n.href} href={n.href} className="quick-link surface" style={{ textDecoration: "none" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={n.icon}/></svg>
            <span>{n.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent activity */}
      <h3 className="section-title">Recent activity</h3>
      {activity.length === 0 ? (
        <div className="empty-state surface">
          <p>No activity yet. Actions by users and the daily job will appear here.</p>
        </div>
      ) : (
        <div className="activity-list surface">
          {activity.map((a, i) => (
            <div key={a.id} className={`activity-row ${i === activity.length - 1 ? "activity-row-last" : ""}`}>
              <div className="activity-avatar">{a.actor_name.slice(0, 2).toUpperCase()}</div>
              <div className="activity-content">
                <span className="activity-name">{a.actor_name}</span>
                <span className="activity-text">{a.text}</span>
              </div>
              <span className="activity-date">{a.business_date}</span>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .ops-overview {
          max-width: 960px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
        }
        .ops-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
        }
        .ops-title {
          font-size: 1.375rem;
          font-weight: 700;
          color: hsl(var(--foreground));
          margin: 0 0 0.25rem;
        }
        .ops-date {
          font-size: 0.8125rem;
          color: hsl(var(--muted));
          margin: 0;
        }

        /* Primary KPI */
        .kpi-primary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .kpi-card-primary {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 1.25rem 1rem;
          text-align: center;
          transition: box-shadow 0.15s, transform 0.15s;
          cursor: pointer;
          color: hsl(var(--foreground));
        }
        .kpi-card-primary:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        .kpi-num-primary {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.2;
        }
        .kpi-label {
          font-size: 0.75rem;
          color: hsl(var(--muted));
          font-weight: 500;
        }

        /* Secondary KPI */
        .kpi-secondary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .kpi-card-secondary {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.125rem;
          padding: 0.875rem 0.75rem;
          text-align: center;
          transition: box-shadow 0.15s;
          cursor: pointer;
          color: hsl(var(--foreground));
        }
        .kpi-card-secondary:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .kpi-num-secondary {
          font-size: 1.25rem;
          font-weight: 700;
          color: hsl(var(--foreground));
        }
        .kpi-label-sm {
          font-size: 0.6875rem;
          color: hsl(var(--muted));
          font-weight: 500;
        }

        /* Section titles */
        .section-title {
          font-size: 0.9375rem;
          font-weight: 600;
          color: hsl(var(--foreground));
          margin: 0 0 0.75rem;
        }

        /* Quick links */
        .quick-links {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        .quick-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.8125rem;
          color: hsl(var(--foreground));
          transition: background 0.15s;
          cursor: pointer;
        }
        .quick-link:hover {
          background: hsl(var(--secondary));
        }
        .quick-link svg {
          flex-shrink: 0;
          color: hsl(var(--muted));
        }

        /* Activity */
        .activity-list { padding: 0; overflow: hidden; }
        .activity-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1.25rem;
          border-bottom: 1px solid hsl(var(--border));
        }
        .activity-row-last { border-bottom: none; }
        .activity-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: hsl(var(--primary) / 0.08);
          color: hsl(var(--primary));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .activity-content {
          flex: 1;
          min-width: 0;
        }
        .activity-name {
          font-weight: 600;
          font-size: 0.8125rem;
          color: hsl(var(--foreground));
          margin-right: 0.375rem;
        }
        .activity-text {
          font-size: 0.8125rem;
          color: hsl(var(--muted));
        }
        .activity-date {
          font-size: 0.75rem;
          color: hsl(var(--muted));
          white-space: nowrap;
          flex-shrink: 0;
        }

        .empty-state {
          padding: 2rem;
          text-align: center;
          color: hsl(var(--muted));
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .kpi-primary { grid-template-columns: repeat(2, 1fr); }
          .kpi-secondary { grid-template-columns: repeat(2, 1fr); }
          .quick-links { grid-template-columns: repeat(3, 1fr); }
          .activity-row { flex-wrap: wrap; gap: 0.375rem; }
        }

        @media (max-width: 480px) {
          .kpi-primary { grid-template-columns: repeat(2, 1fr); }
          .kpi-secondary { grid-template-columns: repeat(2, 1fr); }
          .quick-links { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}
