import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { MailLogClient } from "@/components/ops/MailLogClient";

export default async function OpsMail() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["ops"]}>
      <MailLogClient />
    </RoleGate>
  );
}
