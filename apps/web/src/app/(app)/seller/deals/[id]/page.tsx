import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { DealTrackerClient } from "@/components/seller/DealTrackerClient";

export default async function DealTrackerPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  const { id } = await params;
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <DealTrackerClient submissionId={id} />
    </RoleGate>
  );
}
