import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { PhotosStepClient } from "@/components/seller/sell/PhotosStepClient";

export default async function PhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  const { id } = await params;
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <PhotosStepClient submissionId={id} />
    </RoleGate>
  );
}
