import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { ConfirmClient } from "@/components/seller/sell/ConfirmClient";

export default async function ConfirmPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  const { id } = await params;
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <ConfirmClient submissionId={id} />
    </RoleGate>
  );
}
