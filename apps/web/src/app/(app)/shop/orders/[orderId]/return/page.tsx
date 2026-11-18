import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { RaiseReturnClient } from "@/components/shop/RaiseReturnClient";

export default async function ReturnPage({ params }: { params: Promise<{ orderId: string }> }) {
  const actor = await getActor();
  const { orderId } = await params;
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <RaiseReturnClient orderId={orderId} />
    </RoleGate>
  );
}
