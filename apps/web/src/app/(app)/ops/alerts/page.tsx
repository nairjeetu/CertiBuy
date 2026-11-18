import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { AlertsClient } from "@/components/ops/AlertsClient";

export default async function OpsAlerts() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["ops"]}>
      <AlertsClient />
    </RoleGate>
  );
}
