import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { CatalogueClient } from "@/components/ops/CatalogueClient";

export default async function OpsCatalogue() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["ops"]}>
      <CatalogueClient />
    </RoleGate>
  );
}
