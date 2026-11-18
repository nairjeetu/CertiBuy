"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { Actor } from "@certibuy/application";

/* ── Nav definitions per role ─────────────────────────────────────────── */

const BUYER_NAV = [
  { href: "/shop", label: "Home", icon: "🏠" },
  { href: "/shop/browse", label: "Shop", icon: "🛍" },
  { href: "/shop/orders", label: "My orders", icon: "📦" },
];

const SELLER_NAV = [
  { href: "/seller", label: "Home", icon: "🏠" },
  { href: "/seller/sell", label: "Sell device", icon: "📲" },
  { href: "/seller/payouts", label: "Payouts", icon: "💰" },
];

const OPS_NAV = [
  { href: "/ops", label: "Overview", icon: "📊" },
  { href: "/ops/inventory", label: "Inventory", icon: "📋" },
  { href: "/ops/catalogue", label: "Catalogue", icon: "📱" },
  { href: "/ops/exceptions", label: "Exceptions", icon: "⚠" },
  { href: "/ops/jobs", label: "Jobs", icon: "⚙" },
  { href: "/ops/demo", label: "Demo", icon: "🧪" },
];

const HUB_NAV = [
  { href: "/hub", label: "Queue", icon: "📋" },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function SiteHeader({ actor, businessDate, unreadCount }: {
  actor: Actor;
  businessDate?: string;
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const isOps = actor.role === "ops" || actor.isAdmin;
  const isHub = actor.role === "technician";
  const isBuyer = actor.activeMode === "buyer";

  const navItems = isOps
    ? OPS_NAV
    : isHub
      ? HUB_NAV
      : isBuyer
        ? BUYER_NAV
        : SELLER_NAV;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleModeSwitch(mode: "buyer" | "seller") {
    if (actor.activeMode === mode) return;
    router.push(mode === "buyer" ? "/shop" : "/seller");
  }

  const formattedDate = businessDate
    ? new Date(businessDate + "T00:00:00+05:30").toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "Asia/Kolkata",
      })
    : null;

  return (
    <header className="site-header">
      {/* Row 1: Brand + controls */}
      <div className="header-row header-top">
        <div className="header-brand">
          <Image src="/logo-mark.svg" alt="" width={32} height={32} className="header-logo-img" />
          <div className="header-brand-text">
            <span className="header-brand-name">CertiBuy</span>
            <span className="header-tagline">Buy Smart. Sell Better. Trust Every Device.</span>
          </div>
        </div>

        <div className="header-controls">
          {formattedDate && (
            <span className="header-date-chip">{formattedDate}</span>
          )}

          <Link href="/notifications" className="header-bell" aria-label="Notifications">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {(unreadCount ?? 0) > 0 && (
              <span className="header-badge">{unreadCount}</span>
            )}
          </Link>

          {actor.role === "customer" && (
            <div className="header-mode-switch" role="group" aria-label="Mode">
              <button
                className={`mode-btn ${isBuyer ? "mode-btn-active" : ""}`}
                onClick={() => handleModeSwitch("buyer")}
              >
                Buying
              </button>
              <button
                className={`mode-btn ${!isBuyer ? "mode-btn-active" : ""}`}
                onClick={() => handleModeSwitch("seller")}
              >
                Selling
              </button>
            </div>
          )}

          <Link href="/help" className="header-link">Help</Link>

          <div className="header-user">
            <span className="header-avatar">{getInitials(actor.fullName)}</span>
            <span className="header-user-name">{actor.fullName}</span>
          </div>

          <button onClick={handleSignOut} className="header-signout" aria-label="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Row 2: Navigation pills */}
      <nav className="header-row header-nav" aria-label="Main navigation">
        <div className="header-nav-pills no-scrollbar">
          {navItems.map((n) => {
            const active =
              pathname === n.href ||
              (n.href !== "/shop" && n.href !== "/seller" && n.href !== "/ops" && n.href !== "/hub" && pathname.startsWith(n.href + "/"));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`nav-pill ${active ? "nav-pill-active" : ""}`}
              >
                <span className="nav-pill-icon">{n.icon}</span>
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <style jsx>{`
        .site-header {
          background: hsl(var(--card));
          border-bottom: 1px solid hsl(var(--border));
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .header-row {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }

        /* Row 1 */
        .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 56px;
          gap: 1rem;
        }
        .header-brand {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          flex-shrink: 0;
        }
        .header-brand-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }
        .header-brand-name {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.0625rem;
          color: hsl(var(--foreground));
          letter-spacing: -0.02em;
        }
        .header-tagline {
          font-size: 0.625rem;
          color: hsl(var(--muted));
          letter-spacing: 0.01em;
        }
        .header-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        /* Date chip */
        .header-date-chip {
          font-size: 0.75rem;
          font-weight: 500;
          color: hsl(var(--muted));
          background: hsl(var(--secondary));
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
        }

        /* Bell */
        .header-bell {
          position: relative;
          display: flex;
          align-items: center;
          color: hsl(var(--muted));
          transition: color 0.15s;
        }
        .header-bell:hover { color: hsl(var(--foreground)); }
        .header-badge {
          position: absolute;
          top: -4px;
          right: -6px;
          min-width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.625rem;
          font-weight: 700;
          background: hsl(var(--destructive));
          color: hsl(var(--destructive-foreground));
          border-radius: 9999px;
          padding: 0 4px;
        }

        /* Mode switch */
        .header-mode-switch {
          display: flex;
          background: hsl(var(--secondary));
          border-radius: 9999px;
          padding: 2px;
        }
        .mode-btn {
          border: none;
          background: transparent;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          color: hsl(var(--muted));
          cursor: pointer;
          transition: all 0.15s;
        }
        .mode-btn-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }

        /* Help link */
        .header-link {
          font-size: 0.8125rem;
          font-weight: 500;
          color: hsl(var(--muted));
          text-decoration: none;
          transition: color 0.15s;
        }
        .header-link:hover { color: hsl(var(--foreground)); }

        /* User */
        .header-user {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .header-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.6875rem;
          font-weight: 700;
          flex-shrink: 0;
        }
        .header-user-name {
          font-size: 0.8125rem;
          font-weight: 500;
          color: hsl(var(--foreground));
        }

        /* Sign out */
        .header-signout {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid hsl(var(--border));
          background: transparent;
          border-radius: 6px;
          padding: 0.3125rem;
          color: hsl(var(--muted));
          cursor: pointer;
          transition: all 0.15s;
        }
        .header-signout:hover {
          color: hsl(var(--foreground));
          background: hsl(var(--secondary));
        }

        /* Row 2: Nav */
        .header-nav {
          display: flex;
          align-items: center;
          height: 44px;
          border-top: 1px solid hsl(var(--border));
        }
        .header-nav-pills {
          display: flex;
          gap: 0.25rem;
          overflow-x: auto;
        }
        .nav-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.375rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: hsl(var(--muted));
          text-decoration: none;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .nav-pill:hover {
          color: hsl(var(--foreground));
          background: hsl(var(--secondary));
        }
        .nav-pill-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .nav-pill-active:hover {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .nav-pill-icon {
          font-size: 0.875rem;
          line-height: 1;
        }

        @media (max-width: 768px) {
          .header-tagline { display: none; }
          .header-user-name { display: none; }
          .header-date-chip { display: none; }
          .header-link { display: none; }
        }
        @media (max-width: 480px) {
          .header-mode-switch { display: none; }
        }
      `}</style>
    </header>
  );
}
