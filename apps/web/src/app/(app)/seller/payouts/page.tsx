import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { PayoutsClient } from "@/components/seller/PayoutsClient";

export default async function PayoutsPage() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <PayoutsClient />
    </RoleGate>
  );
}
