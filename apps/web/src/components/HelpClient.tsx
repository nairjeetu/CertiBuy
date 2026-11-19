"use client";

import Link from "next/link";

const FAQ = [
  {
    q: "How does CertiBuy work?",
    a: "CertiBuy is a custody-first refurbished device marketplace. Sellers drop off devices at a hub, our technicians inspect and grade them, and buyers purchase with escrow protection and a 7-day return window.",
  },
  {
    q: "What are the grades?",
    a: "Grade A (Like new) has minimal signs of use. Grade B (Good) has light wear. Grade C (Fair) has visible wear but all features work. Grade D (Value) has heavy wear or cosmetic damage.",
  },
  {
    q: "How is my payment protected?",
    a: "All buyer payments go into escrow. The money is released to CertiBuy only after the 7-day return window closes. If you raise a return, the escrow is held until the return is resolved.",
  },
  {
    q: "What is Instant Cash vs Sell For More?",
    a: "Instant Cash means CertiBuy buys your device outright at the hub — you get paid immediately at a slightly lower price. Sell For More gives you a higher guaranteed price: 50% up front, and the rest when it sells or on day 21.",
  },
  {
    q: "How do returns work?",
    a: "Buyers have a 7-day window after delivery to raise a return. Choose a reason, and CertiBuy will review and resolve it. Depending on the outcome, you may receive a full refund, partial refund or replacement.",
  },
  {
    q: "What warranty do I get?",
    a: "All devices come with a CertiBuy warranty (duration depends on the listing). You can also add an extended warranty at checkout if available.",
  },
  {
    q: "I have a device model not listed in the catalogue",
    a: "CertiBuy regularly adds new models. If your device is not listed, please check back soon or contact support. The ops team can add models to the catalogue at any time.",
  },
];

export function HelpClient() {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 0.5rem", color: "hsl(var(--foreground))" }}>Help</h2>
      <p className="meta" style={{ marginBottom: "1.5rem" }}>
        Common questions about buying and selling on CertiBuy.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {FAQ.map((item, i) => (
          <details key={i} className="surface" style={{ padding: "0.75rem 1rem" }}>
            <summary style={{ fontWeight: 600, fontSize: "0.875rem", cursor: "pointer", color: "hsl(var(--foreground))" }}>
              {item.q}
            </summary>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", lineHeight: 1.6, color: "hsl(var(--muted))" }}>
              {item.a}
            </p>
          </details>
        ))}
      </div>

      <div className="surface" style={{ padding: "1rem", marginTop: "1.5rem", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "hsl(var(--foreground))" }}>
          Still need help?
        </p>
        <p className="meta" style={{ margin: "0.25rem 0 0" }}>
          Contact us at <Link href="mailto:support@certibuy.in" style={{ color: "hsl(var(--primary))" }}>support@certibuy.in</Link>
        </p>
      </div>
    </div>
  );
}
