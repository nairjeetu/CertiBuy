import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { BrowseClient } from "@/components/shop/BrowseClient";

export default async function BrowsePage() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <BrowseClient />
    </RoleGate>
  );
}
