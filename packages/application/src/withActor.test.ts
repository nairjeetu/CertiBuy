import { describe, it, expect } from "vitest";
import { withActor } from "./withActor";
import { ForbiddenError } from "./policy";

const fakeProfile = {
  id: "u1",
  app_role: "customer",
  active_mode: "seller",
  full_name: "Priya",
  hub_id: null,
  is_platform_admin: false,
};

describe("withActor", () => {
  it("resolves actor from auth user + profile and passes to callback", async () => {
    const result = await withActor(
      async () => ({ id: "u1" }),
      async (id) => (id === "u1" ? fakeProfile : null),
      async (actor) => {
        expect(actor.id).toBe("u1");
        expect(actor.role).toBe("customer");
        expect(actor.activeMode).toBe("seller");
        expect(actor.fullName).toBe("Priya");
        return "ok";
      },
    );
    expect(result).toBe("ok");
  });

  it("throws ForbiddenError when no auth user", async () => {
    await expect(
      withActor(async () => null, async () => null, async () => "nope"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError when profile not found", async () => {
    await expect(
      withActor(async () => ({ id: "u1" }), async () => null, async () => "nope"),
    ).rejects.toThrow(ForbiddenError);
  });

  it("re-reads profile every call (never caches)", async () => {
    let callCount = 0;
    const getProfile = async () => {
      callCount++;
      return fakeProfile;
    };
    await withActor(async () => ({ id: "u1" }), getProfile, async () => {});
    await withActor(async () => ({ id: "u1" }), getProfile, async () => {});
    expect(callCount).toBe(2);
  });
});
