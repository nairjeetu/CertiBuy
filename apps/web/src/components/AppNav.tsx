"use client";

import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
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

export function AppNav({ actor }: { actor: Actor }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const isOps = actor.role === "ops" || actor.isAdmin;

  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderBottom: "1px solid #e5e7eb" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span style={{ fontWeight: 600 }}>CertiBuy</span>
        {isOps && (
          <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.8125rem" }}>
            {OPS_NAV.map(n => (
              <Link key={n.href} href={n.href} style={{ color: "#2563eb", textDecoration: "none" }}>
                {n.label}
              </Link>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.875rem" }}>
        <span>{actor.fullName} ({actor.role}{actor.isAdmin ? " / admin" : ""})</span>
        <button onClick={handleSignOut} style={{ cursor: "pointer" }}>Sign out</button>
      </div>
    </nav>
  );
}
