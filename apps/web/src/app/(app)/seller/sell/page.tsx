import { getActor } from "@/server/actor";
import { RoleGate } from "@/components/RoleGate";
import { ModelPickerClient } from "@/components/seller/sell/ModelPickerClient";

export default async function ModelPickerPage() {
  const actor = await getActor();
  return (
    <RoleGate actor={actor} allowed={["customer"]}>
      <ModelPickerClient />
    </RoleGate>
  );
}
