import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { AuditLogClient } from "@/components/ops/AuditLogClient";

export default async function OpsAudit() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["ops"]}>
      <AuditLogClient />
    </RoleGate>
  );
}
