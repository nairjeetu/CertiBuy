"use client";

import { useOrderTracking, useAdvanceShipment } from "@/hooks/use-shop";
import { StatusChip } from "@/components/ui/StatusChip";
import { GradeChip } from "@/components/ui/GradeChip";
import { DeviceImage } from "./DeviceImage";
import { CancelDialog } from "./CancelDialog";
import { formatINR } from "@/lib/format";
import Link from "next/link";

const TIMELINE_STEPS = [
  { key: "paid", label: "Paid into escrow", desc: "Your money is held by CertiBuy." },
  { key: "dispatched", label: "Dispatched", desc: "Sealed and handed to the courier." },
  { key: "in_transit", label: "In transit", desc: "On its way to your address." },
  { key: "delivered", label: "Delivered", desc: "Yours to check over." },
  { key: "return_window", label: "Return window closes", desc: "Last day to raise a return." },
  { key: "settled", label: "Escrow released", desc: "CertiBuy is paid once the window is shut." },
];

function statusIndex(status: string) {
  const map: Record<string, number> = { paid: 0, dispatched: 1, in_transit: 2, delivered: 3, settled: 5, refunded: 5, cancelled: -1 };
  return map[status] ?? -1;
}

export function OrderTrackingClient({ orderId }: { orderId: string }) {
  const { data, isLoading, error, refetch } = useOrderTracking(orderId);
  const advance = useAdvanceShipment();

  if (isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading order...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))", padding: "1rem" }}>{(error as Error).message}</p>;
  if (!data) return <p>Order not found.</p>;

  const d = data as {
    orderId: string; status: string; statusLabel: string; statusTone: string;
    brand: string; model: string; storage: string; grade: string;
    total: number; devicePrice: number; warrantyAddonAmount: number;
    paymentMethod: string; paidAt: string | null; deliveredAt: string | null;
    returnWindowClosesAt: string | null; returnDaysLeft: number | null;
    escrowStatus: string; escrowLabel: string; refundAmount: number | null;
    timeline: { status: string; notes: string | null; createdAt: string }[];
    canCancel: boolean;
    cancelEstimate: { refund: number; deduction: number } | null;
    canReturn: boolean;
    openReturn: { id: string; status: string; statusLabel: string; reason: string; outcome: string | null; refundAmount: number | null } | null;
  };

  const currentIdx = statusIndex(d.status);
  const showAdvance = ["paid", "dispatched", "in_transit"].includes(d.status);

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : null;

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" });

  return (
    <div className="track-page">
      <Link href="/shop/orders" className="track-back">← My orders</Link>

      {/* Device header */}
      <div className="device-header surface">
        <div className="device-header-left">
          <div className="device-header-img">
            <DeviceImage brand={d.brand} model={d.model} size="sm" />
          </div>
          <div>
            <p className="device-header-name">{d.brand} {d.model}</p>
            <p className="meta">{d.storage} · Order {d.orderId.slice(0, 8).toUpperCase()}</p>
            <div style={{ display: "flex", gap: "0.375rem", marginTop: "0.375rem" }}>
              <GradeChip grade={d.grade} />
              <StatusChip label={d.escrowLabel} tone={d.statusTone} />
            </div>
          </div>
        </div>
      </div>

      {/* Price + return window row */}
      <div className="price-row">
        <div>
          <span className="meta">HELD IN ESCROW</span>
          <span className="price-big">{formatINR(d.total)}</span>
        </div>
        {d.returnWindowClosesAt && (
          <div style={{ textAlign: "right" }}>
            <span className="meta">RETURN WINDOW CLOSES</span>
            <span className="date-big">{fmtDate(d.returnWindowClosesAt)}</span>
          </div>
        )}
      </div>

      {/* Two columns: timeline + sidebar */}
      <div className="track-layout">
        <div className="track-main">
          {/* Order timeline */}
          <div className="timeline-card surface">
            <h2 className="card-heading">Order timeline</h2>
            <div className="timeline">
              {TIMELINE_STEPS.map((step, i) => {
                const done = i <= currentIdx;
                const isCurrent = i === currentIdx;
                const timelineEntry = d.timeline.find((t) => t.status === step.key);
                return (
                  <div key={step.key} className={`timeline-step ${done ? "step-done" : ""} ${isCurrent ? "step-current" : ""}`}>
                    <div className="step-dot">
                      {done && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      )}
                    </div>
                    <div className="step-content">
                      <div className="step-header">
                        <span className="step-label">{step.label}</span>
                        {timelineEntry ? (
                          <span className="meta">{fmtTime(timelineEntry.createdAt)}</span>
                        ) : isCurrent ? (
                          <span className="step-next">Next</span>
                        ) : (
                          <span className="meta">Pending</span>
                        )}
                      </div>
                      <p className="step-desc">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Return info */}
          {d.openReturn && (
            <div className="return-card surface">
              <h3 className="card-heading">Return request</h3>
              <p style={{ fontSize: "0.875rem" }}>Status: <strong>{d.openReturn.statusLabel}</strong></p>
              <p style={{ fontSize: "0.875rem" }}>Reason: {d.openReturn.reason.replace(/_/g, " ")}</p>
              {d.openReturn.outcome && <p style={{ fontSize: "0.875rem" }}>Outcome: {d.openReturn.outcome.replace(/_/g, " ")}</p>}
              {d.openReturn.refundAmount != null && d.openReturn.refundAmount > 0 && (
                <p style={{ fontSize: "0.875rem", color: "hsl(var(--success))", fontWeight: 600 }}>Refunded {formatINR(d.openReturn.refundAmount)}</p>
              )}
            </div>
          )}

          {/* Demo control */}
          {showAdvance && (
            <div className="demo-card surface">
              <span className="meta" style={{ letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>PROTOTYPE CONTROL</span>
              <p className="meta">Couriering is mocked in the demo. This is the same call operations use to move a shipment on.</p>
              <button onClick={() => advance.mutate({ orderId }, { onSuccess: () => refetch() })} disabled={advance.isPending} className="dispatch-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/></svg>
                {advance.isPending ? "Advancing..." : "Dispatch the device"}
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="track-actions">
            {d.canCancel && <CancelDialog orderId={orderId} total={d.total} cancelEstimate={d.cancelEstimate} onDone={() => refetch()} />}
            {d.canReturn && (
              <Link href={`/shop/orders/${orderId}/return`} className="return-btn">Raise a return</Link>
            )}
          </div>

          <p className="track-footnote">Your money leaves escrow only when the return window closes — and it is refunded in full if you raise a return in time and the device is at fault.</p>
        </div>

        {/* Right sidebar */}
        <aside className="track-sidebar">
          <div className="sidebar-card surface">
            <h3 className="card-heading">Delivering to</h3>
            <p style={{ fontWeight: 600, fontSize: "0.9375rem", margin: "0 0 0.125rem" }}>&mdash;</p>
            <p className="meta">Address on file</p>
          </div>

          <div className="sidebar-card surface">
            <h3 className="card-heading">What you paid</h3>
            <div className="pay-row"><span>Device</span><span>{formatINR(d.devicePrice)}</span></div>
            {d.warrantyAddonAmount > 0 && (
              <div className="pay-row"><span>Second-year warranty</span><span>{formatINR(d.warrantyAddonAmount)}</span></div>
            )}
            <div className="pay-total"><span>Paid into escrow</span><span>{formatINR(d.total)}</span></div>
            <div className="pay-row"><span>Payment method</span><span>{d.paymentMethod.toUpperCase()}</span></div>
            <div className="pay-row"><span>Warranty</span><span>12 months</span></div>
            {d.refundAmount != null && d.refundAmount > 0 && (
              <div className="pay-row" style={{ color: "hsl(var(--success))" }}><span>Refunded</span><span>{formatINR(d.refundAmount)}</span></div>
            )}
          </div>
        </aside>
      </div>

      {/* Help link */}
      <div className="track-help">
        <Link href="/help" className="track-help-link">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Need help?
        </Link>
      </div>

      <style jsx>{`
        .track-page { max-width: 1000px; margin: 0 auto; padding: 1.5rem 1rem 3rem; }
        .track-back { font-size: 0.8125rem; color: hsl(var(--muted)); text-decoration: none; }
        .track-back:hover { color: hsl(var(--foreground)); }

        .device-header { display: flex; padding: 1rem 1.25rem; margin: 0.75rem 0 0; }
        .device-header-left { display: flex; gap: 0.75rem; align-items: flex-start; }
        .device-header-img {
          width: 48px; height: 48px; background: hsl(var(--background));
          border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .device-header-name { margin: 0; font-weight: 600; font-size: 0.9375rem; }

        .price-row {
          display: flex; justify-content: space-between; align-items: flex-end;
          padding: 1rem 0; margin-bottom: 0.5rem;
        }
        .price-big { display: block; font-size: 1.75rem; font-weight: 700; color: hsl(var(--foreground)); line-height: 1.2; }
        .date-big { display: block; font-size: 1rem; font-weight: 600; color: hsl(var(--foreground)); }

        .track-layout { display: grid; grid-template-columns: 1fr 280px; gap: 1.5rem; align-items: start; }
        .track-main { display: flex; flex-direction: column; gap: 1rem; }
        .card-heading { font-size: 1rem; font-weight: 700; margin: 0 0 0.75rem; color: hsl(var(--foreground)); }

        /* Timeline */
        .timeline-card { padding: 1.25rem; }
        .timeline { position: relative; padding-left: 1.5rem; }
        .timeline::before {
          content: ""; position: absolute; left: 5px; top: 12px; bottom: 12px;
          width: 2px; background: hsl(var(--border));
        }
        .timeline-step { position: relative; padding-bottom: 1.25rem; }
        .timeline-step:last-child { padding-bottom: 0; }
        .step-dot {
          position: absolute; left: -1.5rem; top: 2px;
          width: 12px; height: 12px; border-radius: 50%;
          background: hsl(var(--border)); display: flex; align-items: center; justify-content: center;
        }
        .step-done .step-dot { background: hsl(var(--primary)); }
        .step-current .step-dot { background: hsl(var(--primary)); box-shadow: 0 0 0 3px hsl(var(--primary) / 0.2); }
        .step-header { display: flex; justify-content: space-between; align-items: baseline; }
        .step-label { font-size: 0.875rem; font-weight: 600; color: hsl(var(--foreground)); }
        .step-next { font-size: 0.75rem; font-weight: 500; color: hsl(var(--primary)); }
        .step-desc { margin: 0.125rem 0 0; font-size: 0.8125rem; color: hsl(var(--muted)); }

        .return-card { padding: 1.25rem; border-left: 3px solid hsl(var(--warning)); }
        .demo-card { padding: 1.25rem; border: 1px dashed hsl(var(--border)); background: hsl(var(--secondary)); }
        .dispatch-btn {
          display: inline-flex; align-items: center; gap: 0.375rem; margin-top: 0.5rem;
          padding: 0.5rem 1rem; border: 1px solid hsl(var(--border)); border-radius: 9999px;
          background: hsl(var(--card)); cursor: pointer; font-size: 0.8125rem; font-weight: 500;
          color: hsl(var(--foreground)); transition: background 0.15s;
        }
        .dispatch-btn:hover { background: hsl(var(--secondary)); }

        .track-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .return-btn {
          padding: 0.5rem 1rem; border: 1px solid hsl(var(--destructive));
          border-radius: 9999px; color: hsl(var(--destructive)); text-decoration: none;
          font-size: 0.8125rem; font-weight: 500; transition: background 0.15s;
        }
        .return-btn:hover { background: hsl(var(--destructive) / 0.05); }

        .track-footnote { font-size: 0.8125rem; color: hsl(var(--muted)); line-height: 1.5; margin-top: 0.5rem; }

        /* Sidebar */
        .track-sidebar { position: sticky; top: 112px; display: flex; flex-direction: column; gap: 1rem; }
        .sidebar-card { padding: 1.25rem; }
        .pay-row { display: flex; justify-content: space-between; font-size: 0.875rem; padding: 0.25rem 0; }
        .pay-total {
          display: flex; justify-content: space-between; font-weight: 700; font-size: 0.9375rem;
          padding: 0.5rem 0; margin: 0.25rem 0; border-top: 1px solid hsl(var(--border));
        }

        .track-help { text-align: center; margin-top: 2rem; }
        .track-help-link {
          display: inline-flex; align-items: center; gap: 0.375rem;
          font-size: 0.8125rem; color: hsl(var(--muted)); text-decoration: none;
        }
        .track-help-link:hover { color: hsl(var(--foreground)); }

        @media (max-width: 768px) {
          .track-layout { grid-template-columns: 1fr; }
          .track-sidebar { position: static; }
          .price-row { flex-direction: column; gap: 0.5rem; }
        }
      `}</style>
    </div>
  );
}
