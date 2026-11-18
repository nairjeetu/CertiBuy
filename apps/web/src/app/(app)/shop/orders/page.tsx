import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { MyOrdersClient } from "@/components/shop/MyOrdersClient";

export default async function OrdersPage() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <MyOrdersClient />
    </RoleGate>
  );
}
