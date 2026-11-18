import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { ExceptionsClient } from "@/components/ops/ExceptionsClient";

export default async function OpsExceptions() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["ops"]}>
      <ExceptionsClient />
    </RoleGate>
  );
}
