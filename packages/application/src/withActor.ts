import type { Actor } from "./actor";
import { effectiveRole } from "./actor";
import { ForbiddenError } from "./policy";

export interface ProfileRow {
  id: string;
  app_role: string;
  active_mode: string;
  full_name: string;
  hub_id: string | null;
  is_platform_admin: boolean;
}

export interface AuthUser {
  id: string;
}

export type GetAuthUser = () => Promise<AuthUser | null>;
export type GetProfile = (userId: string) => Promise<ProfileRow | null>;

export async function withActor<T>(
  getAuthUser: GetAuthUser,
  getProfile: GetProfile,
  fn: (actor: Actor) => Promise<T>,
): Promise<T> {
  const user = await getAuthUser();
  if (!user) throw new ForbiddenError("Not authenticated.");

  const profile = await getProfile(user.id);
  if (!profile) throw new ForbiddenError("Profile not found.");

  const actor: Actor = {
    id: profile.id,
    role: effectiveRole({
      app_role: profile.app_role as "customer" | "technician" | "ops",
      is_platform_admin: profile.is_platform_admin,
    }),
    isAdmin: profile.is_platform_admin,
    hubId: profile.hub_id,
    activeMode: profile.active_mode as "buyer" | "seller",
    fullName: profile.full_name,
  };

  return fn(actor);
}
