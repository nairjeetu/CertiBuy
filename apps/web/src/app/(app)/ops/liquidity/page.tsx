import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { LiquidityClient } from "@/components/ops/LiquidityClient";

export default async function OpsLiquidity() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["ops"]}>
      <LiquidityClient />
    </RoleGate>
  );
}
