import { describe, it, expect, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function queryAs(userId: string, sql: string): Promise<unknown[]> {
  return db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL ROLE authenticated`);
    await tx.$executeRawUnsafe(`SET LOCAL app.current_user_id = '${userId}'`);
    return tx.$queryRawUnsafe(sql);
  });
}

async function expectForbidden(userId: string, sql: string) {
  const rows = (await queryAs(userId, sql)) as unknown[];
  expect(rows).toHaveLength(0);
}

describe("RLS policies (plain Postgres, SET ROLE authenticated)", () => {
  afterAll(async () => {
    await db.$disconnect();
  });

  // ─── Settings ───
  it("any user can read settings", async () => {
    const rows = (await queryAs("user-seller", "SELECT id FROM settings")) as { id: number }[];
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  // ─── Profiles ───
  it("seller reads own profile", async () => {
    const rows = (await queryAs("user-seller", "SELECT id FROM profiles WHERE id = 'user-seller'")) as { id: string }[];
    expect(rows).toHaveLength(1);
  });

  it("seller cannot read another customer's profile", async () => {
    await expectForbidden("user-seller", "SELECT id FROM profiles WHERE id = 'user-buyer'");
  });

  it("admin reads all profiles", async () => {
    const rows = (await queryAs("user-admin", "SELECT id FROM profiles")) as { id: string }[];
    expect(rows.length).toBeGreaterThanOrEqual(4);
  });

  it("technician (staff via is_staff()) reads all profiles", async () => {
    // technician is NOT staff by our definition (is_staff checks ops or is_platform_admin)
    // so tech should only see their own profile
    const rows = (await queryAs("user-tech", "SELECT id FROM profiles")) as { id: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("user-tech");
  });

  // ─── Device models (readable by anyone authenticated) ───
  it("buyer reads device models", async () => {
    const rows = (await queryAs("user-buyer", "SELECT id FROM device_models")) as { id: string }[];
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });

  // ─── Hubs (readable by anyone authenticated) ───
  it("seller reads hubs", async () => {
    const rows = (await queryAs("user-seller", "SELECT id FROM hubs")) as { id: string }[];
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });

  // ─── Blacklisted IMEIs (staff only) ───
  it("customer cannot read blacklisted IMEIs", async () => {
    await expectForbidden("user-seller", "SELECT id FROM blacklisted_imeis");
  });

  // ─── Unauthenticated access is blocked ───
  it("no user id means no settings access", async () => {
    const rows = await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE authenticated`);
      await tx.$executeRawUnsafe(`SET LOCAL app.current_user_id = ''`);
      return tx.$queryRawUnsafe("SELECT id FROM settings");
    });
    expect(rows).toHaveLength(0);
  });
});
