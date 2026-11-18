import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { ListingDetailClient } from "@/components/shop/ListingDetailClient";

export default async function ListingDetailPage({ params }: { params: Promise<{ listingId: string }> }) {
  const actor = await getActor();
  const { listingId } = await params;
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <ListingDetailClient listingId={listingId} />
    </RoleGate>
  );
}
