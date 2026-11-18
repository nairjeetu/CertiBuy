import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { ConfirmationClient } from "@/components/shop/ConfirmationClient";

export default async function ConfirmationPage({ params }: { params: Promise<{ orderId: string }> }) {
  const actor = await getActor();
  const { orderId } = await params;
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <ConfirmationClient orderId={orderId} />
    </RoleGate>
  );
}
