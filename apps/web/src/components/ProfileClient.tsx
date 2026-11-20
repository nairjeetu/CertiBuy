"use client";

import { useMyProfile } from "@/hooks/use-profile";
import Link from "next/link";

interface ProfileData {
  fullName: string;
  phone: string;
  city: string;
  deliveryAddress: string;
  payoutAccount: string;
  appRole: string;
  activeMode: string;
  trustScore: number;
  memberSince: string;
  orderCount: number;
  submissionCount: number;
}

function InfoRow({ label, value, empty }: { label: string; value: string; empty?: string }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className={`info-value ${!value ? "info-empty" : ""}`}>{value || empty || "Not set"}</span>
      <style jsx>{`
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.875rem 0;
          border-bottom: 1px solid hsl(var(--border));
        }
        .info-label {
          font-size: 0.875rem;
          color: hsl(var(--muted));
        }
        .info-value {
          font-size: 0.875rem;
          font-weight: 500;
          color: hsl(var(--foreground));
          text-align: right;
          max-width: 60%;
          word-break: break-word;
        }
        .info-empty {
          color: hsl(var(--muted));
          font-style: italic;
          font-weight: 400;
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="stat-card surface">
      <div className="stat-icon">{icon}</div>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      <style jsx>{`
        .stat-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 1.25rem 1rem;
          text-align: center;
        }
        .stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: hsl(var(--primary) / 0.08);
          color: hsl(var(--primary));
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.375rem;
        }
        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: hsl(var(--foreground));
          line-height: 1.2;
        }
        .stat-label {
          font-size: 0.75rem;
          color: hsl(var(--muted));
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

export function ProfileClient() {
  const { data, isLoading, error } = useMyProfile();

  if (isLoading) return (
    <div className="profile-loading">
      <div className="spinner" />
      <p>Loading your profile...</p>
      <style jsx>{`
        .profile-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50vh; color: hsl(var(--muted)); gap: 0.75rem; }
        .spinner { width: 28px; height: 28px; border: 3px solid hsl(var(--border)); border-top-color: hsl(var(--primary)); border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );

  if (error) return <p style={{ color: "hsl(var(--destructive))", padding: "2rem", textAlign: "center" }}>{(error as Error).message}</p>;

  const p = data as unknown as ProfileData;
  const memberDate = new Date(p.memberSince).toLocaleDateString("en-IN", {
    month: "long", year: "numeric", timeZone: "Asia/Kolkata"
  });

  function getInitials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  return (
    <div className="profile-page">
      {/* Header card */}
      <div className="profile-header surface">
        <div className="profile-avatar">{getInitials(p.fullName)}</div>
        <h1 className="profile-name">{p.fullName || "Your Account"}</h1>
        <span className="profile-role">{p.appRole === "customer" ? "Buyer & Seller" : p.appRole === "technician" ? "Hub Technician" : "Operations"}</span>
        <span className="profile-member">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Member since {memberDate}
        </span>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <StatCard
          label="Orders placed"
          value={p.orderCount}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 7v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-3-5z"/><line x1="3" y1="7" x2="21" y2="7"/></svg>}
        />
        <StatCard
          label="Devices sold"
          value={p.submissionCount}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>}
        />
        <StatCard
          label="Trust score"
          value={p.trustScore}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
        />
      </div>

      {/* Personal details */}
      <div className="section-card surface">
        <h2 className="section-heading">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Personal details
        </h2>
        <InfoRow label="Full name" value={p.fullName} />
        <InfoRow label="Phone" value={p.phone} empty="Add your mobile number" />
        <InfoRow label="City" value={p.city} empty="Add your city" />
      </div>

      {/* Delivery */}
      <div className="section-card surface">
        <h2 className="section-heading">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          Delivery address
        </h2>
        <InfoRow label="Address" value={p.deliveryAddress} empty="Add your delivery address" />
      </div>

      {/* Payout */}
      <div className="section-card surface">
        <h2 className="section-heading">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Payout details
        </h2>
        <InfoRow label="Payout account" value={p.payoutAccount} empty="Add your bank or UPI details" />
      </div>

      {/* Quick links */}
      <div className="quick-links">
        <Link href="/help" className="quick-link surface">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Help centre
        </Link>
        <Link href="/notifications" className="quick-link surface">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          Notifications
        </Link>
      </div>

      <style jsx>{`
        .profile-page {
          max-width: 640px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
        }

        /* Header */
        .profile-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 2rem 1.5rem;
          margin-bottom: 1rem;
        }
        .profile-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }
        .profile-name {
          font-size: 1.375rem;
          font-weight: 700;
          color: hsl(var(--foreground));
          margin: 0 0 0.25rem;
        }
        .profile-role {
          font-size: 0.8125rem;
          color: hsl(var(--primary));
          font-weight: 600;
          background: hsl(var(--primary) / 0.08);
          padding: 0.1875rem 0.625rem;
          border-radius: 9999px;
          margin-bottom: 0.5rem;
        }
        .profile-member {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: hsl(var(--muted));
        }

        /* Stats */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        /* Sections */
        .section-card {
          padding: 1.25rem 1.5rem;
          margin-bottom: 1rem;
        }
        .section-heading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: hsl(var(--foreground));
          margin: 0 0 0.5rem;
        }
        .section-heading svg { color: hsl(var(--muted)); }

        /* Quick links */
        .quick-links {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .quick-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.25rem;
          text-decoration: none;
          color: hsl(var(--foreground));
          font-size: 0.875rem;
          font-weight: 500;
          transition: background 0.15s;
        }
        .quick-link:hover { background: hsl(var(--secondary)); }
        .quick-link svg { color: hsl(var(--muted)); flex-shrink: 0; }

        @media (max-width: 480px) {
          .stats-row { grid-template-columns: 1fr; }
          .quick-links { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
