"use client";

import { useState } from "react";
import { useCheckout, usePlaceOrder } from "@/hooks/use-shop";
import { GradeChip } from "../ui/GradeChip";
import { formatINR } from "@/lib/format";
import { useRouter } from "next/navigation";

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
    return <p style={{ color: "hsl(var(--destructive))" }}>This listing is no longer available.</p>;
  }

  const total = d.currentPrice + (addon ? d.warrantyAddonPrice : 0);
  const canSubmit = name.length >= 2 && /^\d{10}$/.test(phone) && address.length >= 10;

  const handlePlace = () => {
    placeOrder.mutate(
      { listingId, deliveryName: name, deliveryPhone: phone, deliveryAddress: address, paymentMethod: method, warrantyAddon: addon },
      { onSuccess: (res: { orderId?: string }) => { if (res.orderId) router.push(`/shop/confirmation/${res.orderId}`); } },
    );
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem 0.75rem",
    border: "1px solid hsl(var(--input))",
    borderRadius: "0.875rem",
    fontSize: "0.875rem",
    boxSizing: "border-box",
    background: "hsl(var(--card))",
    color: "hsl(var(--foreground))",
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem", color: "hsl(var(--foreground))" }}>Checkout</h2>

      <div className="surface" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600 }}>{d.brand} {d.model}</p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "hsl(var(--muted))" }}>{d.storage}</p>
          </div>
          <GradeChip grade={d.grade} />
        </div>
        <p style={{ margin: "0.5rem 0 0", fontSize: "1.125rem", fontWeight: 700 }}>{formatINR(d.currentPrice)}</p>
        {d.warrantyMonths > 0 && (
          <p className="meta" style={{ marginTop: "0.25rem" }}>{d.warrantyMonths} mo warranty included</p>
        )}
      </div>

      {d.addonAllowed && (
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", fontSize: "0.875rem" }}>
          <input type="checkbox" checked={addon} onChange={(e) => setAddon(e.target.checked)} />
          Extended warranty add-on (+{formatINR(d.warrantyAddonPrice)})
        </label>
      )}

      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.5rem" }}>Delivery details</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label>
            <span className="sr-only">Full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" aria-required="true" style={inputStyle} />
          </label>
          <label>
            <span className="sr-only">Phone number</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit phone" maxLength={10} aria-required="true" style={inputStyle} />
          </label>
          <label>
            <span className="sr-only">Delivery address</span>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address (min 10 chars)" rows={3} aria-required="true" style={{ ...inputStyle, resize: "vertical" }} />
          </label>
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, margin: "0 0 0.5rem" }}>Payment method</h3>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {d.paymentMethods.map((m) => (
            <label key={m} style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.875rem" }}>
              <input type="radio" name="payment" value={m} checked={method === m} onChange={() => setMethod(m)} />
              {m.toUpperCase()}
            </label>
          ))}
        </div>
      </div>

      <div style={{ borderTop: "1px solid hsl(var(--border))", paddingTop: "1rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
          <span>Device</span><span>{formatINR(d.currentPrice)}</span>
        </div>
        {addon && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
            <span>Warranty add-on</span><span>{formatINR(d.warrantyAddonPrice)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid hsl(var(--border))" }}>
          <span>Total</span><span>{formatINR(total)}</span>
        </div>
      </div>

      <p className="meta" style={{ marginBottom: "1rem" }}>
        {d.returnWindowDays}-day return window after delivery. Escrow protects your payment.
      </p>

      <button
        onClick={handlePlace}
        disabled={!canSubmit || placeOrder.isPending}
        style={{
          width: "100%",
          padding: "0.75rem",
          backgroundColor: canSubmit ? "hsl(var(--primary))" : "hsl(var(--muted))",
          color: "hsl(var(--primary-foreground))",
          border: "none",
          borderRadius: "9999px",
          fontWeight: 600,
          cursor: canSubmit ? "pointer" : "default",
          fontSize: "1rem",
          transition: "opacity 0.15s",
        }}
      >
        {placeOrder.isPending ? "Placing order..." : `Pay ${formatINR(total)}`}
      </button>

      {placeOrder.isError && (
        <p style={{ color: "hsl(var(--destructive))", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          {(placeOrder.error as Error).message}
        </p>
      )}
    </div>
  );
}
