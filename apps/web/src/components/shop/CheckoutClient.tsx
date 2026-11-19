"use client";

import { useState } from "react";
import { useCheckout, usePlaceOrder } from "@/hooks/use-shop";
import { GradeChip } from "../ui/GradeChip";
import { DeviceImage } from "./DeviceImage";
import { formatINR } from "@/lib/format";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function CheckoutClient({ listingId }: { listingId: string }) {
  const { data, isLoading, error } = useCheckout(listingId);
  const placeOrder = usePlaceOrder();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [method, setMethod] = useState("upi");
  const [addon, setAddon] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [simDecline, setSimDecline] = useState(false);

  if (isLoading) return <p style={{ color: "hsl(var(--muted))", padding: "2rem", textAlign: "center" }}>Loading checkout...</p>;
  if (error) return <p style={{ color: "hsl(var(--destructive))" }}>{(error as Error).message}</p>;
  if (!data) return <p>Listing not found.</p>;

  const d = data as {
    listingId: string; brand: string; model: string; storage: string; grade: string;
    currentPrice: number; warrantyMonths: number; warrantyAddonPrice: number; addonAllowed: boolean;
    deliveryDefaults: { name: string; phone: string; address: string };
    paymentMethods: string[]; returnWindowDays: number; available: boolean;
  };

  if (!prefilled && d.deliveryDefaults.name) {
    setName(d.deliveryDefaults.name);
    setPhone(d.deliveryDefaults.phone);
    setAddress(d.deliveryDefaults.address);
    setPrefilled(true);
  }

  if (!d.available) {
    return <p style={{ color: "hsl(var(--destructive))", padding: "2rem", textAlign: "center" }}>This listing is no longer available.</p>;
  }

  const total = d.currentPrice + (addon ? d.warrantyAddonPrice : 0);
  const phoneValid = /^\+?\d{10,13}$/.test(phone.replace(/\s/g, ""));
  const canSubmit = name.length >= 2 && phoneValid && address.length >= 10 && !simDecline;

  const handlePlace = () => {
    placeOrder.mutate(
      { listingId, deliveryName: name, deliveryPhone: phone, deliveryAddress: address, paymentMethod: method, warrantyAddon: addon },
      { onSuccess: (res: { orderId?: string }) => { if (res.orderId) router.push(`/shop/confirmation/${res.orderId}`); } },
    );
  };

  const methodLabel: Record<string, string> = { upi: "UPI", card: "Card", netbanking: "Net banking" };
  const methodDesc: Record<string, string> = { upi: "Pay by any UPI app", card: "Credit or debit card", netbanking: "Any major bank" };

  return (
    <div className="checkout-page">
      <Link href={`/shop/${listingId}`} className="checkout-back">← Back to the device</Link>
      <h1 className="checkout-title">Checkout</h1>
      <p className="checkout-subtitle">Paid into escrow, and held until the {d.returnWindowDays}-day return window closes.</p>

      <div className="checkout-layout">
        {/* Left column */}
        <div className="checkout-main">
          {/* Device summary */}
          <div className="device-summary surface">
            <div className="device-summary-img">
              <DeviceImage brand={d.brand} model={d.model} size="sm" />
            </div>
            <div className="device-summary-info">
              <p className="device-summary-name">{d.brand} {d.model}</p>
              <p className="meta">{d.storage}</p>
            </div>
            <GradeChip grade={d.grade} />
            <span className="device-summary-price">{formatINR(d.currentPrice)}</span>
          </div>

          {/* Delivery */}
          <div className="form-section surface">
            <h2 className="form-heading">Delivery</h2>
            <p className="meta" style={{ marginBottom: "1rem" }}>Where the courier should bring the device.</p>
            <div className="form-row">
              <label className="form-field">
                <span className="field-label">Full name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
              </label>
              <label className="form-field">
                <span className="field-label">Mobile number</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input" />
                {phone && !phoneValid && <span className="field-error">Enter a 10-digit mobile number.</span>}
              </label>
            </div>
            <label className="form-field">
              <span className="field-label">Delivery address</span>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="form-input" placeholder="Flat, street, area, city, PIN code" />
            </label>
          </div>

          {/* Warranty addon */}
          {d.addonAllowed && (
            <div className="addon-section surface">
              <div className="addon-row">
                <div>
                  <h3 className="form-heading" style={{ margin: 0 }}>Add a second year of warranty</h3>
                  <p className="meta">{formatINR(d.warrantyAddonPrice)} — 5% of the price. Covers the same faults for months 12 to 24.</p>
                </div>
                <button
                  type="button"
                  className={`toggle-btn ${addon ? "toggle-on" : ""}`}
                  onClick={() => setAddon(!addon)}
                  role="switch"
                  aria-checked={addon}
                >
                  <span className="toggle-thumb" />
                </button>
              </div>
            </div>
          )}

          {/* Payment method */}
          <div className="form-section surface">
            <h2 className="form-heading">Payment</h2>
            <p className="meta" style={{ marginBottom: "1rem" }}>The money is held in escrow — CertiBuy is paid when the return window closes.</p>
            <div className="payment-methods">
              {d.paymentMethods.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`payment-btn ${method === m ? "payment-active" : ""}`}
                  onClick={() => { setMethod(m); setSimDecline(false); }}
                >
                  <span className="payment-btn-label">{methodLabel[m] ?? m.toUpperCase()}</span>
                  <span className="meta">{methodDesc[m] ?? ""}</span>
                </button>
              ))}
            </div>
            <label className="sim-decline-label">
              <input type="radio" checked={simDecline} onChange={() => setSimDecline(!simDecline)} />
              <div>
                <span>Simulate a declined payment</span>
                <span className="meta" style={{ display: "block" }}>Nothing is written: no order, no escrow, and the device stays on sale.</span>
              </div>
            </label>
          </div>
        </div>

        {/* Right sidebar: order summary */}
        <aside className="checkout-sidebar">
          <div className="summary-card surface">
            <h2 className="form-heading">Order summary</h2>
            <div className="summary-row">
              <span>{d.brand} {d.model}</span>
              <span>{formatINR(d.currentPrice)}</span>
            </div>
            <div className="summary-row">
              <span>Grade</span>
              <span>{d.grade}</span>
            </div>
            {addon && (
              <div className="summary-row">
                <span>Second-year warranty</span>
                <span>{formatINR(d.warrantyAddonPrice)}</span>
              </div>
            )}
            <div className="summary-total">
              <span>Total paid now</span>
              <span>{formatINR(total)}</span>
            </div>

            <div className="summary-escrow-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>{formatINR(total)} is held in escrow. CertiBuy receives it only after your return window closes.</span>
            </div>

            <button
              onClick={handlePlace}
              disabled={!canSubmit || placeOrder.isPending}
              className="pay-btn"
            >
              {placeOrder.isPending ? "Placing order..." : `Pay ${formatINR(total)} into escrow`}
            </button>

            <p className="meta" style={{ textAlign: "center", marginTop: "0.5rem" }}>Escrow is released when the return window closes.</p>

            {placeOrder.isError && (
              <p style={{ color: "hsl(var(--destructive))", fontSize: "0.875rem", marginTop: "0.5rem" }}>
                {(placeOrder.error as Error).message}
              </p>
            )}

            <p className="meta" style={{ marginTop: "0.75rem" }}>Add a name, a 10-digit mobile and the full address to pay.</p>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .checkout-page {
          max-width: 1100px;
          margin: 0 auto;
          padding: 1.5rem 1rem 3rem;
        }
        .checkout-back {
          font-size: 0.8125rem;
          color: hsl(var(--muted));
          text-decoration: none;
        }
        .checkout-title {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 1.75rem;
          font-weight: 400;
          margin: 0.75rem 0 0.25rem;
          color: hsl(var(--foreground));
        }
        .checkout-subtitle {
          font-size: 0.875rem;
          color: hsl(var(--muted));
          margin: 0 0 1.5rem;
        }
        .checkout-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.5rem;
          align-items: start;
        }
        .checkout-main {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        /* Device summary */
        .device-summary {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
        }
        .device-summary-img {
          width: 48px; height: 48px;
          background: hsl(var(--background));
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .device-summary-info { flex: 1; }
        .device-summary-name { margin: 0; font-weight: 600; font-size: 0.9375rem; }
        .device-summary-price { font-weight: 700; font-size: 1.0625rem; white-space: nowrap; }

        /* Forms */
        .form-section { padding: 1.25rem; }
        .form-heading {
          font-size: 1rem;
          font-weight: 700;
          margin: 0 0 0.25rem;
          color: hsl(var(--foreground));
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .form-input {
          padding: 0.5rem 0.75rem;
          border: 1px solid hsl(var(--input));
          border-radius: 0.875rem;
          font-size: 0.9375rem;
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          resize: vertical;
        }
        .form-input:focus {
          outline: 2px solid hsl(var(--ring));
          outline-offset: 1px;
        }
        .field-error {
          font-size: 0.75rem;
          color: hsl(var(--destructive));
        }

        /* Addon */
        .addon-section { padding: 1.25rem; }
        .addon-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }
        .toggle-btn {
          position: relative;
          width: 44px; height: 24px;
          border-radius: 12px;
          border: none;
          background: hsl(var(--border));
          cursor: pointer;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .toggle-on { background: hsl(var(--primary)); }
        .toggle-thumb {
          position: absolute;
          top: 2px; left: 2px;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: white;
          transition: transform 0.2s;
        }
        .toggle-on .toggle-thumb { transform: translateX(20px); }

        /* Payment */
        .payment-methods {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .payment-btn {
          padding: 0.75rem;
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          background: hsl(var(--card));
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
        }
        .payment-active {
          border-color: hsl(var(--primary));
          background: hsl(var(--primary) / 0.04);
        }
        .payment-btn-label {
          display: block;
          font-weight: 600;
          font-size: 0.875rem;
          color: hsl(var(--foreground));
          margin-bottom: 0.125rem;
        }
        .sim-decline-label {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: hsl(var(--foreground));
          cursor: pointer;
        }

        /* Sidebar */
        .checkout-sidebar { position: sticky; top: 112px; }
        .summary-card { padding: 1.25rem; }
        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          padding: 0.375rem 0;
          color: hsl(var(--foreground));
        }
        .summary-total {
          display: flex;
          justify-content: space-between;
          font-weight: 700;
          font-size: 1rem;
          padding: 0.75rem 0 0.5rem;
          margin-top: 0.5rem;
          border-top: 1px solid hsl(var(--border));
        }
        .summary-escrow-note {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: hsl(var(--muted));
          background: hsl(var(--secondary));
          padding: 0.625rem 0.75rem;
          border-radius: 0.75rem;
          margin: 0.75rem 0;
          line-height: 1.4;
        }
        .summary-escrow-note svg { flex-shrink: 0; margin-top: 0.125rem; }
        .pay-btn {
          width: 100%;
          padding: 0.75rem;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border: none;
          border-radius: 9999px;
          font-weight: 600;
          font-size: 0.9375rem;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .pay-btn:hover:not(:disabled) { opacity: 0.9; }
        .pay-btn:disabled {
          opacity: 0.5;
          cursor: default;
        }

        @media (max-width: 768px) {
          .checkout-layout { grid-template-columns: 1fr; }
          .checkout-sidebar { position: static; order: -1; }
          .form-row { grid-template-columns: 1fr; }
          .payment-methods { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
