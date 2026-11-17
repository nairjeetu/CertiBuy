import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { OfferClient } from "@/components/seller/sell/OfferClient";

export default async function OfferPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  const { id } = await params;
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <OfferClient submissionId={id} />
    </RoleGate>
  );
}
