import type { Actor } from "./actor";
import type { AppRole } from "@certibuy/contracts";

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function requireRole(actor: Actor, ...roles: AppRole[]): void {
  if (actor.isAdmin) return;
  if (!roles.includes(actor.role)) {
    throw new ForbiddenError(
      `This action requires one of [${roles.join(", ")}]. You have "${actor.role}".`,
    );
  }
}

export function requireOwner(actor: Actor, ownerId: string): void {
  if (actor.isAdmin) return;
  if (actor.id !== ownerId) {
    throw new ForbiddenError("You can only access your own records.");
  }
}

export function requireHub(actor: Actor, hubId: string): void {
  if (actor.isAdmin) return;
  if (actor.role === "ops") return;
  if (actor.hubId !== hubId) {
    throw new ForbiddenError("You can only access records in your assigned hub.");
  }
}

export function requireStaffMfa(mfaVerified: boolean): void {
  const requireMfa = process.env.REQUIRE_STAFF_MFA !== "false";
  if (requireMfa && !mfaVerified) {
    throw new ForbiddenError("This action requires MFA verification.");
  }
}
