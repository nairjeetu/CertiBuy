import type { Actor } from "@certibuy/application";
import type { AppRole } from "@certibuy/contracts";
import { canOpenArea } from "@certibuy/application";
import { redirect } from "next/navigation";
import { homeFor } from "@certibuy/application";

export function RoleGate({
  actor,
  allowed,
  children,
}: {
  actor: Actor;
  allowed: AppRole[];
  children: React.ReactNode;
}) {
  if (!canOpenArea(actor, allowed)) {
    redirect(homeFor(actor));
  }
  return <>{children}</>;
}
