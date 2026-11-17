import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";

export default async function ShopHome() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <h2>Browse certified devices</h2>
      <p>All devices are inspected, graded and covered by warranty.</p>
    </RoleGate>
  );
}
