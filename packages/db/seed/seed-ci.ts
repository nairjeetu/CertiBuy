import { PrismaClient } from "../src/generated/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

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

  for (const dm of [
    {
      id: "model-iphone-14",
      brand: "Apple",
      model: "iPhone 14",
      storage: "128 GB",
      category: "phone" as const,
      launch_date: "2022-09-16",
      successor_launch_date: "2023-09-22",
      original_price: 79_900,
      market_price_a: 55_000,
      b2b_floor_price: 25_000,
      liquidity_tier: "high" as const,
    },
    {
      id: "model-galaxy-s24",
      brand: "Samsung",
      model: "Galaxy S24 Ultra",
      storage: "256 GB",
      category: "phone" as const,
      launch_date: "2024-01-17",
      successor_launch_date: "2025-01-22",
      original_price: 129_999,
      market_price_a: 85_000,
      market_price_b: 77_350,
      market_price_c: 69_700,
      market_price_d: 51_000,
      b2b_floor_price: 40_000,
      liquidity_tier: "high" as const,
    },
    {
      id: "model-pixel-7",
      brand: "Google",
      model: "Pixel 7",
      storage: "128 GB",
      category: "phone" as const,
      launch_date: "2022-10-13",
      original_price: 59_999,
      market_price_a: 30_000,
      b2b_floor_price: 12_000,
      liquidity_tier: "low" as const,
    },
  ]) {
    await prisma.deviceModel.upsert({ where: { id: dm.id }, update: {}, create: dm });
  }

  for (const modelId of ["model-iphone-14", "model-galaxy-s24", "model-pixel-7"]) {
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

  const profiles = [
    { id: "ci-admin", full_name: "CI Admin", app_role: "ops" as const, active_mode: "buyer" as const, is_platform_admin: true },
    { id: "ci-tech", full_name: "CI Tech", app_role: "technician" as const, active_mode: "buyer" as const, hub_id: "hub-indiranagar" },
    { id: "ci-seller", full_name: "CI Seller", app_role: "customer" as const, active_mode: "seller" as const },
    { id: "ci-buyer", full_name: "CI Buyer", app_role: "customer" as const, active_mode: "buyer" as const },
  ];

  for (const p of profiles) {
    await prisma.profile.upsert({
      where: { id: p.id },
      update: {},
      create: { id: p.id, full_name: p.full_name, app_role: p.app_role, active_mode: p.active_mode, hub_id: p.hub_id ?? null, is_platform_admin: p.is_platform_admin ?? false },
    });
  }

  console.log("CI seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
