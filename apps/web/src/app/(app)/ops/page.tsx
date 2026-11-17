import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";

export default async function OpsHome() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["ops"]}>
      <h2>Operations dashboard</h2>
      <p>Exceptions, payouts, catalogue, and demo controls.</p>
    </RoleGate>
  );
}
