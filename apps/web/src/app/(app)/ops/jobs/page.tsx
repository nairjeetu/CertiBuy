import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { JobsClient } from "@/components/ops/JobsClient";

export default async function OpsJobs() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["ops"]}>
      <JobsClient />
    </RoleGate>
  );
}
