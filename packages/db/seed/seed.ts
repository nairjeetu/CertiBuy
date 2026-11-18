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
  const deviceModels = [
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
      market_price_b: 49_500,
      market_price_c: 44_000,
      market_price_d: 33_000,
      b2b_floor_price: 25_000,
      liquidity_tier: "high" as const,
      image_url: "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-14-finish-select-202209-6-1inch-blue?wid=400&hei=400&fmt=png-alpha",
    },
    {
      id: "model-iphone-15-pro",
      brand: "Apple",
      model: "iPhone 15 Pro",
      storage: "256 GB",
      category: "phone" as const,
      launch_date: "2023-09-22",
      successor_launch_date: "2024-09-20",
      original_price: 134_900,
      market_price_a: 95_000,
      market_price_b: 85_500,
      market_price_c: 76_000,
      market_price_d: 57_000,
      b2b_floor_price: 45_000,
      liquidity_tier: "high" as const,
      image_url: "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium?wid=400&hei=400&fmt=png-alpha",
    },
    {
      id: "model-iphone-13",
      brand: "Apple",
      model: "iPhone 13",
      storage: "128 GB",
      category: "phone" as const,
      launch_date: "2021-09-24",
      successor_launch_date: "2022-09-16",
      original_price: 69_900,
      market_price_a: 42_000,
      market_price_b: 37_800,
      market_price_c: 33_600,
      market_price_d: 25_200,
      b2b_floor_price: 18_000,
      liquidity_tier: "high" as const,
      image_url: "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-13-finish-select-202207-midnight?wid=400&hei=400&fmt=png-alpha",
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
      image_url: "https://images.samsung.com/is/image/samsung/p6pim/in/2401/gallery/in-galaxy-s24-ultra-s928-sm-s928bztqins-thumb-539572576?$400_400_PNG$",
    },
    {
      id: "model-galaxy-s23",
      brand: "Samsung",
      model: "Galaxy S23",
      storage: "128 GB",
      category: "phone" as const,
      launch_date: "2023-02-17",
      successor_launch_date: "2024-01-17",
      original_price: 74_999,
      market_price_a: 45_000,
      market_price_b: 40_500,
      market_price_c: 36_000,
      market_price_d: 27_000,
      b2b_floor_price: 20_000,
      liquidity_tier: "medium" as const,
      image_url: "https://images.samsung.com/is/image/samsung/p6pim/in/2302/gallery/in-galaxy-s23-s911-sm-s911bzkdins-thumb-534863401?$400_400_PNG$",
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
      market_price_b: 27_000,
      market_price_c: 24_000,
      market_price_d: 18_000,
      b2b_floor_price: 12_000,
      liquidity_tier: "low" as const,
      image_url: "https://lh3.googleusercontent.com/HJmo9WqFry7E1G2eAnHqVIlWkUHtOmTnJhLD-yjZSvYFqH4PUhwRGGQa_N4MKhKZYQ=w400",
    },
    {
      id: "model-pixel-8-pro",
      brand: "Google",
      model: "Pixel 8 Pro",
      storage: "256 GB",
      category: "phone" as const,
      launch_date: "2023-10-12",
      original_price: 106_999,
      market_price_a: 60_000,
      market_price_b: 54_000,
      market_price_c: 48_000,
      market_price_d: 36_000,
      b2b_floor_price: 25_000,
      liquidity_tier: "medium" as const,
      image_url: "https://lh3.googleusercontent.com/wPMJBpToEN0U2sFCNRJE5GrGWfCqMo3F47VDi5MVfA6p7M2J40hI6CLUIC0G8IBcl5k=w400",
    },
    {
      id: "model-oneplus-12",
      brand: "OnePlus",
      model: "OnePlus 12",
      storage: "256 GB",
      category: "phone" as const,
      launch_date: "2024-01-23",
      original_price: 64_999,
      market_price_a: 42_000,
      market_price_b: 37_800,
      market_price_c: 33_600,
      market_price_d: 25_200,
      b2b_floor_price: 18_000,
      liquidity_tier: "medium" as const,
      image_url: "",
    },
    {
      id: "model-ipad-air-m2",
      brand: "Apple",
      model: "iPad Air M2",
      storage: "256 GB",
      category: "tablet" as const,
      launch_date: "2024-05-15",
      original_price: 69_900,
      market_price_a: 52_000,
      market_price_b: 46_800,
      market_price_c: 41_600,
      market_price_d: 31_200,
      b2b_floor_price: 22_000,
      liquidity_tier: "medium" as const,
      image_url: "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/ipad-air-finish-select-202405-11inch-blue?wid=400&hei=400&fmt=png-alpha",
    },
    {
      id: "model-macbook-air-m2",
      brand: "Apple",
      model: "MacBook Air M2",
      storage: "256 GB",
      category: "laptop" as const,
      launch_date: "2022-07-15",
      original_price: 119_900,
      market_price_a: 78_000,
      market_price_b: 70_200,
      market_price_c: 62_400,
      market_price_d: 46_800,
      b2b_floor_price: 35_000,
      liquidity_tier: "medium" as const,
      image_url: "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/macbook-air-midnight-select-20220606?wid=400&hei=400&fmt=png-alpha",
    },
  ];

  for (const dm of deviceModels) {
    await prisma.deviceModel.upsert({
      where: { id: dm.id },
      update: { image_url: dm.image_url },
      create: dm,
    });
  }

  // Liquidity scores (cold start)
  for (const dm of deviceModels) {
    const score = dm.liquidity_tier === "high" ? 80 : dm.liquidity_tier === "medium" ? 60 : 45;
    await prisma.liquidityScore.upsert({
      where: { id: `liq-${dm.id}` },
      update: {},
      create: {
        id: `liq-${dm.id}`,
        device_model_id: dm.id,
        score,
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

  // ─── Demo listings ──────────────────────────────────────────────────────
  // Need a seller id to create submissions/devices
  const sellerProfile = await prisma.profile.findFirst({
    where: { app_role: "customer", active_mode: "seller" },
  });
  if (!sellerProfile) {
    console.log("No seller profile found, skipping demo listings.");
  } else {
    const sellerId = sellerProfile.id;
    const today = new Date().toISOString().slice(0, 10);

    const demoListings = [
      { modelId: "model-iphone-15-pro", grade: "A" as const, colour: "Natural Titanium", imei: "353456789012345", tag: "CB-BLR-001", hub: "hub-indiranagar", option: "sell_for_more" as const },
      { modelId: "model-iphone-14", grade: "B" as const, colour: "Blue", imei: "353456789012346", tag: "CB-BLR-002", hub: "hub-indiranagar", option: "sell_for_more" as const },
      { modelId: "model-iphone-13", grade: "A" as const, colour: "Midnight", imei: "353456789012347", tag: "CB-BLR-003", hub: "hub-koramangala", option: "instant_cash" as const },
      { modelId: "model-galaxy-s24", grade: "A" as const, colour: "Titanium Yellow", imei: "353456789012348", tag: "CB-BLR-004", hub: "hub-indiranagar", option: "sell_for_more" as const },
      { modelId: "model-galaxy-s24", grade: "B" as const, colour: "Titanium Grey", imei: "353456789012349", tag: "CB-BLR-005", hub: "hub-koramangala", option: "sell_for_more" as const },
      { modelId: "model-galaxy-s23", grade: "A" as const, colour: "Phantom Black", imei: "353456789012350", tag: "CB-BLR-006", hub: "hub-indiranagar", option: "instant_cash" as const },
      { modelId: "model-galaxy-s23", grade: "C" as const, colour: "Green", imei: "353456789012351", tag: "CB-BLR-007", hub: "hub-koramangala", option: "sell_for_more" as const },
      { modelId: "model-pixel-8-pro", grade: "A" as const, colour: "Bay", imei: "353456789012352", tag: "CB-BLR-008", hub: "hub-indiranagar", option: "sell_for_more" as const },
      { modelId: "model-pixel-7", grade: "B" as const, colour: "Obsidian", imei: "353456789012353", tag: "CB-BLR-009", hub: "hub-koramangala", option: "instant_cash" as const },
      { modelId: "model-oneplus-12", grade: "A" as const, colour: "Flowy Emerald", imei: "353456789012354", tag: "CB-BLR-010", hub: "hub-indiranagar", option: "sell_for_more" as const },
      { modelId: "model-ipad-air-m2", grade: "A" as const, colour: "Blue", imei: "353456789012355", tag: "CB-BLR-011", hub: "hub-indiranagar", option: "sell_for_more" as const },
      { modelId: "model-macbook-air-m2", grade: "B" as const, colour: "Midnight", imei: "353456789012356", tag: "CB-BLR-012", hub: "hub-koramangala", option: "sell_for_more" as const },
    ];

    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    const warrantyMonths = settings?.warranty_months ?? 3;

    for (const dl of demoListings) {
      const subId = `demo-sub-${dl.tag.toLowerCase()}`;
      const devId = `demo-dev-${dl.tag.toLowerCase()}`;
      const listId = `demo-list-${dl.tag.toLowerCase()}`;

      const model = await prisma.deviceModel.findUnique({ where: { id: dl.modelId } });
      if (!model) continue;

      const priceKey = `market_price_${dl.grade.toLowerCase()}` as keyof typeof model;
      const basePrice = (model[priceKey] as number | null) ?? model.market_price_a;
      const floorPrice = model.b2b_floor_price;
      const acqCost = Math.round(basePrice * 0.7);

      await prisma.submission.upsert({
        where: { id: subId },
        update: {},
        create: {
          id: subId,
          seller_id: sellerId,
          device_model_id: dl.modelId,
          colour: dl.colour,
          imei: dl.imei,
          age_months: 12,
          declared_cosmetic: dl.grade,
          repaired: "no",
          status: "accepted",
          chosen_option: dl.option,
          final_grade: dl.grade,
          consent_at: new Date(),
        },
      });

      await prisma.device.upsert({
        where: { id: devId },
        update: {},
        create: {
          id: devId,
          submission_id: subId,
          seller_id: sellerId,
          device_model_id: dl.modelId,
          colour: dl.colour,
          imei: dl.imei,
          tag_id: dl.tag,
          final_grade: dl.grade,
          payout_option: dl.option,
          acquisition_cost: acqCost,
          owner: "certibuy",
          custody_at: "hub",
          hub_id: dl.hub,
          status: "listed",
        },
      });

      await prisma.listing.upsert({
        where: { id: listId },
        update: {},
        create: {
          id: listId,
          device_id: devId,
          base_price: basePrice,
          current_price: basePrice,
          floor_price: floorPrice,
          listed_at: today,
          warranty_months: dl.grade === "D" ? 0 : warrantyMonths,
          status: "active",
        },
      });
    }

    console.log(`Created ${demoListings.length} demo listings.`);
  }

  console.log("\nSeed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
