import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { MetricsClient } from "@/components/ops/MetricsClient";

export default async function OpsMetrics() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["ops"]}>
      <MetricsClient />
    </RoleGate>
  );
}
