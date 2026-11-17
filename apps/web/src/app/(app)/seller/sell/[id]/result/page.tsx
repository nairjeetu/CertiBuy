import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { GradeResultClient } from "@/components/seller/sell/GradeResultClient";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  const { id } = await params;
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <GradeResultClient submissionId={id} />
    </RoleGate>
  );
}
