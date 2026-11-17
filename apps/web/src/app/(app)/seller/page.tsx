import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { SellerHomeClient } from "@/components/seller/SellerHomeClient";

export default async function SellerHome() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <SellerHomeClient />
    </RoleGate>
  );
}
