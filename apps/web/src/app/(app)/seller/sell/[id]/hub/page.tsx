import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { HubBookingClient } from "@/components/seller/sell/HubBookingClient";

export default async function HubPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  const { id } = await params;
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <HubBookingClient submissionId={id} />
    </RoleGate>
  );
}
