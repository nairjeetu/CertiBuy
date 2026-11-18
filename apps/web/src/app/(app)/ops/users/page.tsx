import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { UsersClient } from "@/components/ops/UsersClient";

export default async function OpsUsers() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["ops"]}>
      <UsersClient />
    </RoleGate>
  );
}
