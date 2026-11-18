import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { OverviewClient } from "@/components/ops/OverviewClient";

export default async function OpsHome() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["ops"]}>
      <OverviewClient />
    </RoleGate>
  );
}
