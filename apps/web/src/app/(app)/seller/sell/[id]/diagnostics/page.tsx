import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { DiagnosticsStepClient } from "@/components/seller/sell/DiagnosticsStepClient";

export default async function DiagnosticsPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  const { id } = await params;
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <DiagnosticsStepClient submissionId={id} />
    </RoleGate>
  );
}
