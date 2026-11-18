import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { SupportClient } from "@/components/ops/SupportClient";

export default async function OpsSupport() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["ops"]}>
      <SupportClient />
    </RoleGate>
  );
}
