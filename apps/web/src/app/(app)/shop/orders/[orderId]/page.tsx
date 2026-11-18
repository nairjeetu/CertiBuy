import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { OrderTrackingClient } from "@/components/shop/OrderTrackingClient";

export default async function OrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const actor = await getActor();
  const { orderId } = await params;
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <OrderTrackingClient orderId={orderId} />
    </RoleGate>
  );
}
