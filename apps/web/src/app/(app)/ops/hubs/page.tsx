import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { HubsClient } from "@/components/ops/HubsClient";

export default async function OpsHubs() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["ops"]}>
      <HubsClient />
    </RoleGate>
  );
}
