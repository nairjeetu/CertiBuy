import { describe, it, expect } from "vitest";
import { effectiveRole, homeFor, canOpenArea, canSeeAll } from "./actor";
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

describe("effectiveRole", () => {
  it("returns customer for a normal customer profile", () => {
    expect(effectiveRole({ app_role: "customer", is_platform_admin: false })).toBe("customer");
  });

  it("returns ops for ops role", () => {
    expect(effectiveRole({ app_role: "ops", is_platform_admin: false })).toBe("ops");
  });

  it("returns technician for technician role", () => {
    expect(effectiveRole({ app_role: "technician", is_platform_admin: false })).toBe("technician");
  });
});

describe("homeFor", () => {
  it("sends customer/buyer to /shop", () => {
    expect(homeFor(makeActor({ role: "customer", activeMode: "buyer" }))).toBe("/shop");
  });

  it("sends customer/seller to /seller", () => {
    expect(homeFor(makeActor({ role: "customer", activeMode: "seller" }))).toBe("/seller");
  });

  it("sends technician to /hub", () => {
    expect(homeFor(makeActor({ role: "technician" }))).toBe("/hub");
  });

  it("sends ops to /ops", () => {
    expect(homeFor(makeActor({ role: "ops" }))).toBe("/ops");
  });
});

describe("canOpenArea", () => {
  it("customer can open customer area", () => {
    expect(canOpenArea(makeActor({ role: "customer" }), ["customer"])).toBe(true);
  });

  it("customer cannot open ops area", () => {
    expect(canOpenArea(makeActor({ role: "customer" }), ["ops"])).toBe(false);
  });

  it("admin can open any area", () => {
    expect(canOpenArea(makeActor({ isAdmin: true, role: "ops" }), ["technician"])).toBe(true);
  });
});

describe("canSeeAll", () => {
  it("ops can see all", () => {
    expect(canSeeAll(makeActor({ role: "ops" }))).toBe(true);
  });

  it("admin can see all", () => {
    expect(canSeeAll(makeActor({ isAdmin: true }))).toBe(true);
  });

  it("customer cannot see all", () => {
    expect(canSeeAll(makeActor({ role: "customer" }))).toBe(false);
  });
});
