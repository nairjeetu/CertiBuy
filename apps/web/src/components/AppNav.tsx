"use client";

import { createClient } from "@/lib/supabase-browser";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { Actor } from "@certibuy/application";

const OPS_NAV = [
  { href: "/ops", label: "Overview" },
  { href: "/ops/inventory", label: "Inventory" },
  { href: "/ops/catalogue", label: "Catalogue" },
  { href: "/ops/exceptions", label: "Exceptions" },
  { href: "/ops/jobs", label: "Jobs" },
  { href: "/ops/demo", label: "Demo" },
];

const BUYER_NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/shop/browse", label: "Browse" },
  { href: "/shop/orders", label: "My orders" },
];

const SELLER_NAV = [
  { href: "/seller", label: "Dashboard" },
  { href: "/seller/submit", label: "Sell device" },
];

export function AppNav({ actor }: { actor: Actor }) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isOps = actor.role === "ops" || actor.isAdmin;
  const isCustomer = actor.role === "customer";
  const isBuyerMode = actor.activeMode === "buyer";
  const navItems = isOps ? OPS_NAV : isCustomer ? (isBuyerMode ? BUYER_NAV : SELLER_NAV) : [];

  return (
    <nav className="app-nav" aria-label="Main navigation">
      <div className="app-nav-left">
        <Link href={isOps ? "/ops" : isBuyerMode ? "/shop" : "/seller"} className="app-nav-logo">
          CertiBuy
        </Link>
        <div className="app-nav-links">
          {navItems.map(n => {
            const active = pathname === n.href || (n.href !== "/" && pathname.startsWith(n.href + "/"));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`app-nav-link ${active ? "app-nav-link-active" : ""}`}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="app-nav-right">
        <span className="app-nav-user">{actor.fullName}</span>
        <button onClick={handleSignOut} className="app-nav-signout">Sign out</button>
      </div>

      <style jsx>{`
        .app-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
          height: 52px;
          border-bottom: 1px solid var(--border);
          background: var(--bg);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .app-nav-left {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .app-nav-logo {
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: -0.02em;
          color: var(--fg);
          text-decoration: none;
        }
        .app-nav-links {
          display: flex;
          gap: 0.125rem;
        }
        .app-nav-link {
          padding: 0.375rem 0.625rem;
          border-radius: 6px;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--muted);
          text-decoration: none;
          transition: color 0.15s, background 0.15s;
        }
        .app-nav-link:hover {
          color: var(--fg);
          background: var(--border);
        }
        .app-nav-link-active {
          color: var(--fg);
          background: var(--border);
        }
        .app-nav-right {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .app-nav-user {
          font-size: 0.8125rem;
          color: var(--muted);
        }
        .app-nav-signout {
          padding: 0.3125rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: transparent;
          color: var(--fg);
          font-size: 0.75rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .app-nav-signout:hover {
          background: var(--border);
        }

        @media (max-width: 640px) {
          .app-nav-user { display: none; }
          .app-nav-links { gap: 0; }
          .app-nav-link { padding: 0.375rem 0.5rem; font-size: 0.75rem; }
        }
      `}</style>
    </nav>
  );
}
