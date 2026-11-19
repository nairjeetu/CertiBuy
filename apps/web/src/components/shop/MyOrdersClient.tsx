"use client";

import { useMyOrders } from "@/hooks/use-shop";
import { StatusChip } from "@/components/ui/StatusChip";
import { GradeChip } from "@/components/ui/GradeChip";
import { DeviceImage } from "./DeviceImage";
import { formatINR } from "@/lib/format";
import Link from "next/link";

interface OrderItem {
  orderId: string; status: string; statusLabel: string; statusTone: string;
  brand: string; model: string; storage: string; grade: string;
  total: number; createdAt: string; hasOpenReturn: boolean;
}

export function MyOrdersClient() {
  const { data, isLoading, error } = useMyOrders();

  if (isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading your orders...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))", padding: "1rem" }}>{(error as Error).message}</p>;

  const items = (data?.items ?? []) as OrderItem[];

  return (
    <div className="orders-page">
      <div className="orders-header">
        <div>
          <h1 className="orders-title">My orders</h1>
          <p className="orders-subtitle">Escrow, delivery and returns for every device you&apos;ve bought.</p>
        </div>
        {items.length > 0 && <span className="meta">{items.length} order{items.length !== 1 ? "s" : ""}</span>}
      </div>

      {items.length === 0 ? (
        <div className="orders-empty surface">
          <p>You have no orders yet.</p>
          <Link href="/shop/browse" className="orders-browse-link">Browse devices</Link>
        </div>
      ) : (
        <div className="orders-grid">
          {items.map((o) => (
            <div key={o.orderId} className="order-card surface">
              <div className="order-card-top">
                <div className="order-card-img">
                  <DeviceImage brand={o.brand} model={o.model} size="sm" />
                </div>
                <div className="order-card-info">
                  <p className="order-card-name">{o.brand} {o.model}</p>
                  <p className="meta">{o.storage} · Order {o.orderId.slice(0, 8).toUpperCase()}</p>
                  <div className="order-card-chips">
                    <GradeChip grade={o.grade} />
                    <StatusChip label={o.statusLabel} tone={o.statusTone} />
                    {o.hasOpenReturn && <StatusChip label="Return in progress" tone="warning" />}
                  </div>
                </div>
                <div className="order-card-price">
                  <span className="order-price">{formatINR(o.total)}</span>
                  <span className="meta">{o.status === "refunded" ? "refunded" : "in escrow"}</span>
                </div>
              </div>
              <div className="order-card-bottom">
                <span className="meta">
                  {new Date(o.createdAt).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    timeZone: "Asia/Kolkata",
                  })}
                </span>
                <Link href={`/shop/orders/${o.orderId}`} className="track-btn">
                  Track order →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="orders-help">
        <Link href="/help" className="orders-help-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Need help?
        </Link>
      </div>

      <style jsx>{`
        .orders-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem 1rem 3rem;
        }
        .orders-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }
        .orders-title {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 1.75rem;
          font-weight: 400;
          margin: 0 0 0.25rem;
          color: hsl(var(--foreground));
        }
        .orders-subtitle {
          font-size: 0.875rem;
          color: hsl(var(--muted));
          margin: 0;
        }
        .orders-empty {
          text-align: center;
          padding: 3rem 1rem;
          color: hsl(var(--muted));
        }
        .orders-browse-link {
          display: inline-block;
          margin-top: 0.75rem;
          font-size: 0.875rem;
          color: hsl(var(--primary));
          text-decoration: underline;
        }

        .orders-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .order-card { overflow: hidden; }
        .order-card-top {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          align-items: flex-start;
        }
        .order-card-img {
          width: 44px; height: 44px;
          background: hsl(var(--background));
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .order-card-info { flex: 1; min-width: 0; }
        .order-card-name {
          margin: 0;
          font-weight: 600;
          font-size: 0.9375rem;
          line-height: 1.3;
        }
        .order-card-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.375rem;
          margin-top: 0.375rem;
        }
        .order-card-price {
          text-align: right;
          flex-shrink: 0;
        }
        .order-price {
          display: block;
          font-weight: 700;
          font-size: 1rem;
          color: hsl(var(--foreground));
        }
        .order-card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.25rem;
          border-top: 1px solid hsl(var(--border));
        }
        .track-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.875rem;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-radius: 9999px;
          font-size: 0.8125rem;
          font-weight: 600;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .track-btn:hover { opacity: 0.9; }

        .orders-help {
          text-align: center;
          margin-top: 2rem;
        }
        .orders-help-link {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8125rem;
          color: hsl(var(--muted));
          text-decoration: none;
        }
        .orders-help-link:hover { color: hsl(var(--foreground)); }

        @media (max-width: 640px) {
          .orders-grid { grid-template-columns: 1fr; }
          .orders-title { font-size: 1.375rem; }
        }
      `}</style>
    </div>
  );
}
