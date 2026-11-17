import { describe, it, expect } from "vitest";
import { requireRole, requireOwner, requireHub, ForbiddenError } from "./policy";
import type { Actor } from "./actor";

function makeActor(overrides: Partial<Actor> = {}): Actor {
  return {
    id: "u1",
    role: "customer",
    isAdmin: false,
    hubId: null,
    activeMode: "buyer",
    fullName: "Test",
    ...overrides,
  };
}

describe("requireRole", () => {
  it("passes when actor has matching role", () => {
    expect(() => requireRole(makeActor({ role: "ops" }), "ops")).not.toThrow();
  });

  it("throws ForbiddenError for wrong role", () => {
    expect(() => requireRole(makeActor({ role: "customer" }), "ops")).toThrow(ForbiddenError);
  });

  it("admin bypasses role check", () => {
    expect(() => requireRole(makeActor({ isAdmin: true, role: "customer" }), "ops")).not.toThrow();
  });
});

describe("requireOwner", () => {
  it("passes when actor is the owner", () => {
    expect(() => requireOwner(makeActor({ id: "u1" }), "u1")).not.toThrow();
  });

  it("throws for non-owner", () => {
    expect(() => requireOwner(makeActor({ id: "u1" }), "u2")).toThrow(ForbiddenError);
  });

  it("admin bypasses owner check", () => {
    expect(() => requireOwner(makeActor({ isAdmin: true, id: "u1" }), "u2")).not.toThrow();
  });
});

describe("requireHub", () => {
  it("passes when hub matches", () => {
    expect(() => requireHub(makeActor({ hubId: "h1", role: "technician" }), "h1")).not.toThrow();
  });

  it("throws for wrong hub", () => {
    expect(() => requireHub(makeActor({ hubId: "h1", role: "technician" }), "h2")).toThrow(ForbiddenError);
  });

  it("ops bypasses hub check", () => {
    expect(() => requireHub(makeActor({ role: "ops" }), "h1")).not.toThrow();
  });
});
