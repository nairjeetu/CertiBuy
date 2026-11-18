import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { GradesClient } from "@/components/shop/GradesClient";

export default async function GradesPage() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <GradesClient />
    </RoleGate>
  );
}
