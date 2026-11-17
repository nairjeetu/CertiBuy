import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";

export default async function HubHome() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["technician"]}>
      <h2>Hub dashboard</h2>
      <p>Today's bookings and inspection queue.</p>
    </RoleGate>
  );
}
