import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { DetailsStepClient } from "@/components/seller/sell/DetailsStepClient";

export default async function DetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  const { id } = await params;
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <DetailsStepClient submissionId={id} />
    </RoleGate>
  );
}
