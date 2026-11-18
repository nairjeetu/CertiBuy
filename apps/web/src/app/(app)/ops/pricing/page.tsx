import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { PricingClient } from "@/components/ops/PricingClient";

export default async function OpsPricing() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["ops"]}>
      <PricingClient />
    </RoleGate>
  );
}
