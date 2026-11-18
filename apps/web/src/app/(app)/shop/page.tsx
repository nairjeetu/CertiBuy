import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { ShopHomeClient } from "@/components/shop/ShopHomeClient";

export default async function ShopHome() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <ShopHomeClient />
    </RoleGate>
  );
}
