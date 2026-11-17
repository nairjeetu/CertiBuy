import type { AppRole } from "@certibuy/contracts";

export interface Actor {
  id: string;
  role: AppRole;
  isAdmin: boolean;
  hubId: string | null;
  activeMode: "buyer" | "seller";
  fullName: string;
}

export function effectiveRole(profile: {
  app_role: AppRole;
  is_platform_admin: boolean;
}): AppRole {
  if (profile.app_role) return profile.app_role;
  if (profile.is_platform_admin) return "ops";
  return "customer";
}

export function homeFor(actor: Actor): string {
  switch (actor.role) {
    case "technician":
      return "/hub";
    case "ops":
      return "/ops";
    case "customer":
      return actor.activeMode === "seller" ? "/seller" : "/shop";
  }
}

export function canOpenArea(
  actor: Actor,
  allowedRoles: AppRole[],
): boolean {
  if (actor.isAdmin) return true;
  return allowedRoles.includes(actor.role);
}

export function canSeeAll(actor: Actor): boolean {
  return actor.role === "ops" || actor.isAdmin;
}
