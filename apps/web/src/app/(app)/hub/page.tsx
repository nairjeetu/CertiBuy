import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { HubQueueClient } from "@/components/hub/HubQueueClient";

export default async function HubHome() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["technician", "ops"]}>
      <HubQueueClient />
    </RoleGate>
  );
}
