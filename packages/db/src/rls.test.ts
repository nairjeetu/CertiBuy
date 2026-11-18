import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadDbUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const content = readFileSync(resolve(__dirname, "../.env"), "utf-8");
    const match = content.match(/^DATABASE_URL="?([^"\n]+)"?$/m);
    if (match) return match[1];
  } catch {}
  throw new Error("DATABASE_URL not set and .env not found.");
}

const db = new PrismaClient({ datasourceUrl: loadDbUrl() });

let adminId: string;
let techId: string;
let sellerId: string;
let buyerId: string;

beforeAll(async () => {
  const profiles = await db.profile.findMany({
    select: { id: true, app_role: true, is_platform_admin: true, active_mode: true },
  });

  const admin = profiles.find(p => p.app_role === "ops" && p.is_platform_admin);
  const tech = profiles.find(p => p.app_role === "technician");
  const seller = profiles.find(p => p.app_role === "customer" && p.active_mode === "seller");
  const buyer = profiles.find(p => p.app_role === "customer" && p.active_mode === "buyer");

  if (!admin) throw new Error("No admin/ops profile found — seed the database first.");
  if (!tech) throw new Error("No technician profile found — seed the database first.");
  if (!seller) throw new Error("No seller (customer/seller mode) profile found — seed the database first.");
  if (!buyer) throw new Error("No buyer (customer/buyer mode) profile found — seed the database first.");

  adminId = admin.id;
  techId = tech.id;
  sellerId = seller.id;
  buyerId = buyer.id;
});

afterAll(async () => {
  await db.$disconnect();
});

async function queryAs(userId: string, sql: string): Promise<unknown[]> {
  return db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL ROLE authenticated`);
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_user_id = '${userId}'`,
    );
    return tx.$queryRawUnsafe(sql);
  });
}

async function expectForbidden(userId: string, sql: string) {
  const rows = (await queryAs(userId, sql)) as unknown[];
  expect(rows).toHaveLength(0);
}

describe("RLS policies (plain Postgres, SET ROLE authenticated)", () => {
  // ─── Settings ───
  it("any user can read settings", async () => {
    const rows = (await queryAs(sellerId, "SELECT id FROM settings")) as { id: number }[];
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });

  // ─── Profiles ───
  it("seller reads own profile", async () => {
    const rows = (await queryAs(
      sellerId,
      `SELECT id FROM profiles WHERE id = '${sellerId}'`,
    )) as { id: string }[];
    expect(rows).toHaveLength(1);
  });

  it("seller cannot read another customer's profile", async () => {
    await expectForbidden(
      sellerId,
      `SELECT id FROM profiles WHERE id = '${buyerId}'`,
    );
  });

  it("admin reads all profiles", async () => {
    const rows = (await queryAs(adminId, "SELECT id FROM profiles")) as { id: string }[];
    expect(rows.length).toBeGreaterThanOrEqual(4);
  });

  it("technician sees only own profile (not staff)", async () => {
    const rows = (await queryAs(techId, "SELECT id FROM profiles")) as { id: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(techId);
  });

  // ─── Device models (readable by anyone authenticated) ───
  it("buyer reads device models", async () => {
    const rows = (await queryAs(buyerId, "SELECT id FROM device_models")) as { id: string }[];
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });

  // ─── Hubs (readable by anyone authenticated) ───
  it("seller reads hubs", async () => {
    const rows = (await queryAs(sellerId, "SELECT id FROM hubs")) as { id: string }[];
    expect(rows.length).toBeGreaterThanOrEqual(2);
  });

  // ─── Blacklisted IMEIs (staff only) ───
  it("customer cannot read blacklisted IMEIs", async () => {
    await expectForbidden(sellerId, "SELECT id FROM blacklisted_imeis");
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
