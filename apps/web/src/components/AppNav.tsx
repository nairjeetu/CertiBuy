"use client";

import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import type { Actor } from "@certibuy/application";

export function AppNav({ actor }: { actor: Actor }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem 1rem", borderBottom: "1px solid #e5e7eb" }}>
      <span style={{ fontWeight: 600 }}>CertiBuy</span>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.875rem" }}>
        <span>{actor.fullName} ({actor.role}{actor.isAdmin ? " / admin" : ""})</span>
        <button onClick={handleSignOut} style={{ cursor: "pointer" }}>Sign out</button>
      </div>
    </nav>
  );
}
