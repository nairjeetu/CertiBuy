"use client";

import { useShopHome } from "@/hooks/use-shop";
import { ListingCard } from "./ListingCard";
import Link from "next/link";

interface Card {
  listingId: string;
  brand: string;
  model: string;
  storage: string;
  grade: string;
  currentPrice: number;
  warrantyMonths: number;
}

export function ShopHomeClient() {
  const { data, isLoading, error } = useShopHome();

  if (isLoading) return <p>Loading shop...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;

  const newest = (data?.newest ?? []) as Card[];
  const gradeAPicks = (data?.gradeAPicks ?? []) as Card[];
  const totalActive = (data?.totalActive ?? 0) as number;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Browse certified devices</h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#6b7280" }}>
            {totalActive} devices available, all inspected and covered by warranty.
          </p>
        </div>
        <Link
          href="/shop/browse"
          style={{
            display: "inline-block",
            padding: "0.5rem 1rem",
            backgroundColor: "#2563eb",
            color: "#fff",
            borderRadius: 6,
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          Browse all
        </Link>
      </div>

      {newest.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 0.75rem" }}>Just listed</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
            {newest.map((c) => <ListingCard key={c.listingId} {...c} />)}
          </div>
        </section>
      )}

      {gradeAPicks.length > 0 && (
        <section style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 0.75rem" }}>Grade A picks</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
            {gradeAPicks.map((c) => <ListingCard key={c.listingId} {...c} />)}
          </div>
        </section>
      )}

      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <Link
          href="/shop/grades"
          style={{ color: "#2563eb", fontSize: "0.875rem", textDecoration: "underline" }}
        >
          How do grades work?
        </Link>
      </div>
    </div>
  );
}
