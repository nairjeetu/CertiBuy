"use client";

import { useState } from "react";
import { useCheckout, usePlaceOrder } from "@/hooks/use-shop";
import { GradeBadge } from "./GradeBadge";
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

  if (isLoading) return <p>Loading checkout...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;
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
    return <p style={{ color: "#991b1b" }}>This listing is no longer available.</p>;
  }

  const total = d.currentPrice + (addon ? d.warrantyAddonPrice : 0);

  const canSubmit = name.length >= 2 && /^\d{10}$/.test(phone) && address.length >= 10;

  const handlePlace = () => {
    placeOrder.mutate(
      { listingId, deliveryName: name, deliveryPhone: phone, deliveryAddress: address, paymentMethod: method, warrantyAddon: addon },
      { onSuccess: (res: { orderId?: string }) => { if (res.orderId) router.push(`/shop/confirmation/${res.orderId}`); } },
    );
  };

  const inputStyle = { width: "100%", padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: 6, fontSize: "0.875rem", boxSizing: "border-box" as const };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Checkout</h2>

      <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600 }}>{d.brand} {d.model}</p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "#6b7280" }}>{d.storage}</p>
          </div>
          <GradeBadge grade={d.grade} />
        </div>
        <p style={{ margin: "0.5rem 0 0", fontSize: "1.125rem", fontWeight: 700 }}>{formatINR(d.currentPrice)}</p>
        {d.warrantyMonths > 0 && (
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#6b7280" }}>{d.warrantyMonths} mo warranty included</p>
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
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={inputStyle} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit phone" maxLength={10} style={inputStyle} />
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address (min 10 chars)" rows={3} style={{ ...inputStyle, resize: "vertical" }} />
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

      <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
          <span>Device</span><span>{formatINR(d.currentPrice)}</span>
        </div>
        {addon && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
            <span>Warranty add-on</span><span>{formatINR(d.warrantyAddonPrice)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #e5e7eb" }}>
          <span>Total</span><span>{formatINR(total)}</span>
        </div>
      </div>

      <p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "1rem" }}>
        {d.returnWindowDays}-day return window after delivery. Escrow protects your payment.
      </p>

      <button
        onClick={handlePlace}
        disabled={!canSubmit || placeOrder.isPending}
        style={{
          width: "100%",
          padding: "0.75rem",
          backgroundColor: canSubmit ? "#2563eb" : "#9ca3af",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontWeight: 600,
          cursor: canSubmit ? "pointer" : "default",
          fontSize: "1rem",
        }}
      >
        {placeOrder.isPending ? "Placing order..." : `Pay ${formatINR(total)}`}
      </button>

      {placeOrder.isError && (
        <p style={{ color: "#991b1b", fontSize: "0.875rem", marginTop: "0.5rem" }}>
          {(placeOrder.error as Error).message}
        </p>
      )}
    </div>
  );
}
