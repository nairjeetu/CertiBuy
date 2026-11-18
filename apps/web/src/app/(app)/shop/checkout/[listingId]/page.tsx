import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { CheckoutClient } from "@/components/shop/CheckoutClient";

export default async function CheckoutPage({ params }: { params: Promise<{ listingId: string }> }) {
  const actor = await getActor();
  const { listingId } = await params;
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <CheckoutClient listingId={listingId} />
    </RoleGate>
  );
}
