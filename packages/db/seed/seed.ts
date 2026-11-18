import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!SERVICE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is required. Set it in your environment.");
  process.exit(1);
}

interface AuthUser {
  email: string;
  password: string;
  fullName: string;
  appRole: "customer" | "technician" | "ops";
  activeMode: "seller" | "buyer";
  hubId?: string;
  isPlatformAdmin?: boolean;
}

const DEMO_ACCOUNTS: AuthUser[] = [
  {
    email: "admin@certibuy.demo",
    password: "Demo1234!",
    fullName: "CertiBuy Admin",
    appRole: "ops",
    activeMode: "buyer",
    isPlatformAdmin: true,
  },
  {
    email: "tech@certibuy.demo",
    password: "Demo1234!",
    fullName: "Ravi Kumar",
    appRole: "technician",
    activeMode: "buyer",
    hubId: "hub-indiranagar",
  },
  {
    email: "seller@certibuy.demo",
    password: "Demo1234!",
    fullName: "Priya Sharma",
    appRole: "customer",
    activeMode: "seller",
  },
  {
    email: "buyer@certibuy.demo",
    password: "Demo1234!",
    fullName: "Amit Patel",
    appRole: "customer",
    activeMode: "buyer",
  },
];

async function ensureAuthUser(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_KEY}`,
      apikey: SERVICE_KEY,
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const data = await res.json();

  if (data.id) return data.id;

  if (data.msg?.includes("already") || data.code === 422) {
    const listRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=50`,
      {
        headers: {
          Authorization: `Bearer ${SERVICE_KEY}`,
          apikey: SERVICE_KEY,
        },
      },
    );
    const list = await listRes.json();
    const existing = list.users?.find(
      (u: { email: string }) => u.email === email,
    );
    if (existing) return existing.id;
  }

  throw new Error(`Failed to create auth user ${email}: ${JSON.stringify(data)}`);
}

async function main() {
  // Settings (single row, id=1)
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  // Hubs
  await prisma.hub.upsert({
    where: { id: "hub-indiranagar" },
    update: {},
    create: {
      id: "hub-indiranagar",
      name: "CertiBuy Indiranagar",
      type: "flagship",
      address: "100 Feet Road, Indiranagar",
      city: "Bengaluru",
      pincode: "560038",
      slot_times: ["10:00", "11:00", "12:00", "14:00", "15:00", "16:00"],
      daily_capacity: 20,
    },
  });

  await prisma.hub.upsert({
    where: { id: "hub-koramangala" },
    update: {},
    create: {
      id: "hub-koramangala",
      name: "CertiBuy Koramangala",
      type: "partner",
      address: "5th Block, Koramangala",
      city: "Bengaluru",
      pincode: "560095",
      slot_times: ["10:00", "12:00", "14:00", "16:00"],
      daily_capacity: 12,
    },
  });

  // Device models
  await prisma.deviceModel.upsert({
    where: { id: "model-iphone-14" },
    update: {},
    create: {
      id: "model-iphone-14",
      brand: "Apple",
      model: "iPhone 14",
      storage: "128 GB",
      category: "phone",
      launch_date: "2022-09-16",
      successor_launch_date: "2023-09-22",
      original_price: 79_900,
      market_price_a: 55_000,
      b2b_floor_price: 25_000,
      liquidity_tier: "high",
    },
  });

  await prisma.deviceModel.upsert({
    where: { id: "model-galaxy-s24" },
    update: {},
    create: {
      id: "model-galaxy-s24",
      brand: "Samsung",
      model: "Galaxy S24 Ultra",
      storage: "256 GB",
      category: "phone",
      launch_date: "2024-01-17",
      successor_launch_date: "2025-01-22",
      original_price: 129_999,
      market_price_a: 85_000,
      market_price_b: 77_350,
      market_price_c: 69_700,
      market_price_d: 51_000,
      b2b_floor_price: 40_000,
      liquidity_tier: "high",
    },
  });

  await prisma.deviceModel.upsert({
    where: { id: "model-pixel-7" },
    update: {},
    create: {
      id: "model-pixel-7",
      brand: "Google",
      model: "Pixel 7",
      storage: "128 GB",
      category: "phone",
      launch_date: "2022-10-13",
      original_price: 59_999,
      market_price_a: 30_000,
      b2b_floor_price: 12_000,
      liquidity_tier: "low",
    },
  });

  // Liquidity scores (cold start)
  for (const modelId of [
    "model-iphone-14",
    "model-galaxy-s24",
    "model-pixel-7",
  ]) {
    const tier = modelId === "model-pixel-7" ? 45 : 80;
    await prisma.liquidityScore.upsert({
      where: { id: `liq-${modelId}` },
      update: {},
      create: {
        id: `liq-${modelId}`,
        device_model_id: modelId,
        score: tier,
        source: "cold_start",
        is_current: true,
      },
    });
  }

  // Demo accounts: create in Supabase Auth, then upsert profile with returned UUID
  console.log("\nCreating demo accounts via Supabase Auth...");
  const created: Array<{ email: string; password: string; role: string }> = [];

  for (const acct of DEMO_ACCOUNTS) {
    const userId = await ensureAuthUser(acct.email, acct.password);
    console.log(`  ${acct.email} → ${userId} (${acct.appRole})`);

    await prisma.profile.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        full_name: acct.fullName,
        app_role: acct.appRole,
        active_mode: acct.activeMode,
        hub_id: acct.hubId ?? null,
        is_platform_admin: acct.isPlatformAdmin ?? false,
      },
    });

    created.push({
      email: acct.email,
      password: acct.password,
      role: acct.appRole,
    });
  }

  console.log("\n--- Demo accounts ---");
  console.log("Email                     | Password   | Role");
  console.log("--------------------------|------------|------------");
  for (const c of created) {
    console.log(
      `${c.email.padEnd(26)}| ${c.password.padEnd(11)}| ${c.role}`,
    );
  }

  console.log("\nSeed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
