import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { HubJobClient } from "@/components/hub/HubJobClient";

export default async function HubJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const actor = await getActor();
  const { jobId } = await params;
  return (
    <RoleGate actor={actor} allowed={["technician", "ops"]}>
      <HubJobClient submissionId={jobId} />
    </RoleGate>
  );
}
