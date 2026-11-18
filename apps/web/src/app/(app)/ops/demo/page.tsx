import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { DemoClient } from "@/components/ops/DemoClient";

export default async function OpsDemo() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["ops"]}>
      <DemoClient />
    </RoleGate>
  );
}
