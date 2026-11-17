import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";

export default async function SellerHome() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <h2>Sell your device</h2>
      <p>Start a submission to get an offer for your device.</p>
    </RoleGate>
  );
}
