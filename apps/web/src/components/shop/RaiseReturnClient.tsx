"use client";

import { useReturnOptions } from "@/hooks/use-shop";
import { ReturnForm } from "./ReturnForm";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ReasonOption {
  value: string; label: string;
  estimated: { original: number; deduction: number; refund: number; deduction_label: string };
}

export function RaiseReturnClient({ orderId }: { orderId: string }) {
  const { data, isLoading, error } = useReturnOptions(orderId);
  const router = useRouter();

  if (isLoading) return <p>Loading return options...</p>;
  if (error) return <p style={{ color: "#991b1b" }}>{(error as Error).message}</p>;
  if (!data) return <p>Order not found.</p>;

  const d = data as {
    eligible: boolean; daysLeft: number;
    returnWindowClosesAt: string | null;
    reasons: ReasonOption[];
  };

  if (!d.eligible) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <Link href={`/shop/orders/${orderId}`} style={{ fontSize: "0.875rem", color: "#2563eb", textDecoration: "none" }}>
          Back to order
        </Link>
        <div style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <p style={{ margin: 0, color: "#6b7280" }}>
            Returns are not available for this order.
            {d.daysLeft <= 0 && " The return window has closed."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <Link href={`/shop/orders/${orderId}`} style={{ fontSize: "0.875rem", color: "#2563eb", textDecoration: "none" }}>
        Back to order
      </Link>
      <p style={{ fontSize: "0.75rem", color: "#6b7280", margin: "0.5rem 0 1rem" }}>
        {d.daysLeft} days left in your return window
      </p>
      <ReturnForm
        orderId={orderId}
        reasons={d.reasons}
        onDone={() => router.push(`/shop/orders/${orderId}`)}
      />
    </div>
  );
}
