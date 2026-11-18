import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { InventoryClient } from "@/components/ops/InventoryClient";

export default async function OpsInventory() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["ops"]}>
      <InventoryClient />
    </RoleGate>
  );
}
