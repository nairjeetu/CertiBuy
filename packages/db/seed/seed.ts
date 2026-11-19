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

  // Device models — comprehensive India catalogue
  // Pricing convention: market_price_b = 90% of A, C = 80% of A, D = 60% of A
  // b2b_floor_price ≈ 45–55% of A (liquidation baseline)
  const phone = "phone" as const;
  const tablet = "tablet" as const;
  const laptop = "laptop" as const;
  const high = "high" as const;
  const medium = "medium" as const;
  const low = "low" as const;

  function m(id: string, brand: string, model: string, storage: string, category: "phone" | "tablet" | "laptop",
    launch_date: string, original_price: number, priceA: number, floor: number, tier: "high" | "medium" | "low",
    successor_launch_date?: string) {
    return {
      id, brand, model, storage, category, launch_date,
      ...(successor_launch_date ? { successor_launch_date } : {}),
      original_price,
      market_price_a: priceA,
      market_price_b: Math.round(priceA * 0.9),
      market_price_c: Math.round(priceA * 0.8),
      market_price_d: Math.round(priceA * 0.6),
      b2b_floor_price: floor,
      liquidity_tier: tier,
      image_url: "",
    };
  }

  const deviceModels = [
    // ── Apple iPhone ──────────────────────────────────────────────────────
    m("model-iphone-11",        "Apple", "iPhone 11",          "64 GB",  phone, "2019-09-20", 64_900,  22_000,  10_000, medium, "2020-10-23"),
    m("model-iphone-11-128",    "Apple", "iPhone 11",          "128 GB", phone, "2019-09-20", 69_900,  25_000,  12_000, medium, "2020-10-23"),
    m("model-iphone-12",        "Apple", "iPhone 12",          "64 GB",  phone, "2020-10-23", 79_900,  30_000,  14_000, high,   "2021-09-24"),
    m("model-iphone-12-128",    "Apple", "iPhone 12",          "128 GB", phone, "2020-10-23", 84_900,  34_000,  16_000, high,   "2021-09-24"),
    m("model-iphone-12-mini",   "Apple", "iPhone 12 Mini",     "64 GB",  phone, "2020-10-23", 69_900,  25_000,  12_000, medium, "2021-09-24"),
    m("model-iphone-13-128",    "Apple", "iPhone 13",          "128 GB", phone, "2021-09-24", 69_900,  42_000,  18_000, high,   "2022-09-16"),
    m("model-iphone-13-256",    "Apple", "iPhone 13",          "256 GB", phone, "2021-09-24", 79_900,  48_000,  22_000, high,   "2022-09-16"),
    m("model-iphone-13-mini",   "Apple", "iPhone 13 Mini",     "128 GB", phone, "2021-09-24", 59_900,  34_000,  15_000, medium, "2022-09-16"),
    m("model-iphone-14-128",    "Apple", "iPhone 14",          "128 GB", phone, "2022-09-16", 79_900,  55_000,  25_000, high,   "2023-09-22"),
    m("model-iphone-14-256",    "Apple", "iPhone 14",          "256 GB", phone, "2022-09-16", 89_900,  62_000,  28_000, high,   "2023-09-22"),
    m("model-iphone-14-plus",   "Apple", "iPhone 14 Plus",     "128 GB", phone, "2022-09-16", 89_900,  58_000,  26_000, medium, "2023-09-22"),
    m("model-iphone-14-pro",    "Apple", "iPhone 14 Pro",      "128 GB", phone, "2022-09-16", 129_900, 72_000,  35_000, high,   "2023-09-22"),
    m("model-iphone-14-pro-256","Apple", "iPhone 14 Pro",      "256 GB", phone, "2022-09-16", 139_900, 80_000,  40_000, high,   "2023-09-22"),
    m("model-iphone-14-promax", "Apple", "iPhone 14 Pro Max",  "256 GB", phone, "2022-09-16", 149_900, 88_000,  45_000, high,   "2023-09-22"),
    m("model-iphone-15-128",    "Apple", "iPhone 15",          "128 GB", phone, "2023-09-22", 79_900,  62_000,  28_000, high,   "2024-09-20"),
    m("model-iphone-15-256",    "Apple", "iPhone 15",          "256 GB", phone, "2023-09-22", 89_900,  68_000,  32_000, high,   "2024-09-20"),
    m("model-iphone-15-plus",   "Apple", "iPhone 15 Plus",     "128 GB", phone, "2023-09-22", 89_900,  65_000,  30_000, high,   "2024-09-20"),
    m("model-iphone-15-pro",    "Apple", "iPhone 15 Pro",      "256 GB", phone, "2023-09-22", 134_900, 95_000,  45_000, high,   "2024-09-20"),
    m("model-iphone-15-promax", "Apple", "iPhone 15 Pro Max",  "256 GB", phone, "2023-09-22", 159_900, 110_000, 55_000, high,   "2024-09-20"),
    m("model-iphone-16-128",    "Apple", "iPhone 16",          "128 GB", phone, "2024-09-20", 79_900,  70_000,  35_000, high),
    m("model-iphone-16-256",    "Apple", "iPhone 16",          "256 GB", phone, "2024-09-20", 89_900,  76_000,  38_000, high),
    m("model-iphone-16-plus",   "Apple", "iPhone 16 Plus",     "128 GB", phone, "2024-09-20", 89_900,  75_000,  37_000, high),
    m("model-iphone-16-pro",    "Apple", "iPhone 16 Pro",      "256 GB", phone, "2024-09-20", 119_900, 100_000, 50_000, high),
    m("model-iphone-16-promax", "Apple", "iPhone 16 Pro Max",  "256 GB", phone, "2024-09-20", 144_900, 125_000, 62_000, high),
    m("model-iphone-se3",       "Apple", "iPhone SE (3rd Gen)","64 GB",  phone, "2022-03-18", 43_900,  22_000,  10_000, medium),

    // ── Samsung Galaxy S ──────────────────────────────────────────────────
    m("model-galaxy-s21-fe",    "Samsung", "Galaxy S21 FE 5G",  "128 GB", phone, "2022-01-11", 54_999, 22_000, 10_000, medium, "2023-02-17"),
    m("model-galaxy-s22",       "Samsung", "Galaxy S22 5G",     "128 GB", phone, "2022-02-25", 72_999, 30_000, 14_000, medium, "2023-02-17"),
    m("model-galaxy-s22-ultra", "Samsung", "Galaxy S22 Ultra",  "256 GB", phone, "2022-02-25", 109_999, 48_000, 22_000, medium, "2023-02-17"),
    m("model-galaxy-s23-128",   "Samsung", "Galaxy S23 5G",     "128 GB", phone, "2023-02-17", 74_999, 45_000, 20_000, medium, "2024-01-17"),
    m("model-galaxy-s23-256",   "Samsung", "Galaxy S23 5G",     "256 GB", phone, "2023-02-17", 79_999, 50_000, 23_000, medium, "2024-01-17"),
    m("model-galaxy-s23-ultra", "Samsung", "Galaxy S23 Ultra",  "256 GB", phone, "2023-02-17", 124_999, 68_000, 32_000, high,  "2024-01-17"),
    m("model-galaxy-s23-fe",    "Samsung", "Galaxy S23 FE",     "128 GB", phone, "2023-10-04", 59_999, 32_000, 15_000, medium),
    m("model-galaxy-s24",       "Samsung", "Galaxy S24 5G",     "128 GB", phone, "2024-01-17", 74_999, 55_000, 25_000, high),
    m("model-galaxy-s24-256",   "Samsung", "Galaxy S24 5G",     "256 GB", phone, "2024-01-17", 79_999, 60_000, 28_000, high),
    m("model-galaxy-s24-plus",  "Samsung", "Galaxy S24+",       "256 GB", phone, "2024-01-17", 99_999, 72_000, 34_000, high),
    m("model-galaxy-s24-ultra", "Samsung", "Galaxy S24 Ultra",  "256 GB", phone, "2024-01-17", 129_999, 85_000, 40_000, high),
    m("model-galaxy-s24-ultra-512","Samsung","Galaxy S24 Ultra", "512 GB", phone, "2024-01-17", 144_999, 95_000, 45_000, high),

    // ── Samsung Galaxy A / M / F (budget-mid) ────────────────────────────
    m("model-galaxy-a14",       "Samsung", "Galaxy A14 5G",     "64 GB",  phone, "2023-01-10", 13_999, 6_000,  3_000,  high),
    m("model-galaxy-a15",       "Samsung", "Galaxy A15 5G",     "128 GB", phone, "2024-01-08", 14_499, 8_000,  4_000,  high),
    m("model-galaxy-a25",       "Samsung", "Galaxy A25 5G",     "128 GB", phone, "2024-01-18", 20_999, 12_000, 5_500,  medium),
    m("model-galaxy-a34",       "Samsung", "Galaxy A34 5G",     "128 GB", phone, "2023-03-16", 30_999, 16_000, 7_000,  medium),
    m("model-galaxy-a35",       "Samsung", "Galaxy A35 5G",     "128 GB", phone, "2024-03-21", 29_999, 20_000, 9_000,  medium),
    m("model-galaxy-a54",       "Samsung", "Galaxy A54 5G",     "128 GB", phone, "2023-03-24", 38_999, 20_000, 8_000,  medium),
    m("model-galaxy-a54-256",   "Samsung", "Galaxy A54 5G",     "256 GB", phone, "2023-03-24", 42_999, 23_000, 10_000, medium),
    m("model-galaxy-a55",       "Samsung", "Galaxy A55 5G",     "128 GB", phone, "2024-03-21", 39_999, 26_000, 12_000, medium),
    m("model-galaxy-m34",       "Samsung", "Galaxy M34 5G",     "128 GB", phone, "2023-07-07", 18_999, 10_000, 4_500,  high),
    m("model-galaxy-m54",       "Samsung", "Galaxy M54 5G",     "128 GB", phone, "2023-04-05", 27_999, 14_000, 6_000,  medium),
    m("model-galaxy-f54",       "Samsung", "Galaxy F54 5G",     "128 GB", phone, "2023-06-12", 27_999, 14_000, 6_000,  medium),
    m("model-galaxy-z-flip5",   "Samsung", "Galaxy Z Flip5",    "256 GB", phone, "2023-07-26", 99_999, 55_000, 25_000, medium),
    m("model-galaxy-z-fold5",   "Samsung", "Galaxy Z Fold5",    "256 GB", phone, "2023-07-26", 154_999, 85_000, 40_000, medium),

    // ── OnePlus ───────────────────────────────────────────────────────────
    m("model-oneplus-10-pro",   "OnePlus", "10 Pro 5G",         "128 GB", phone, "2022-03-31", 66_999, 28_000, 12_000, medium),
    m("model-oneplus-10t",      "OnePlus", "10T 5G",            "128 GB", phone, "2022-08-03", 49_999, 22_000, 10_000, medium),
    m("model-oneplus-11",       "OnePlus", "11 5G",             "128 GB", phone, "2023-02-07", 56_999, 32_000, 15_000, medium),
    m("model-oneplus-11-256",   "OnePlus", "11 5G",             "256 GB", phone, "2023-02-07", 61_999, 36_000, 17_000, medium),
    m("model-oneplus-12",       "OnePlus", "12 5G",             "256 GB", phone, "2024-01-23", 64_999, 42_000, 18_000, medium),
    m("model-oneplus-12-512",   "OnePlus", "12 5G",             "512 GB", phone, "2024-01-23", 69_999, 48_000, 22_000, medium),
    m("model-oneplus-12r",      "OnePlus", "12R 5G",            "128 GB", phone, "2024-01-23", 39_999, 28_000, 12_000, medium),
    m("model-oneplus-nord-ce3", "OnePlus", "Nord CE 3 Lite 5G", "128 GB", phone, "2023-04-04", 19_999, 11_000, 4_500,  high),
    m("model-oneplus-nord-ce4", "OnePlus", "Nord CE 4 Lite 5G", "128 GB", phone, "2024-06-24", 19_999, 14_000, 6_000,  high),
    m("model-oneplus-nord-3",   "OnePlus", "Nord 3 5G",         "128 GB", phone, "2023-07-05", 33_999, 20_000, 9_000,  medium),
    m("model-oneplus-nord-4",   "OnePlus", "Nord 4 5G",         "128 GB", phone, "2024-07-24", 29_999, 22_000, 10_000, medium),

    // ── Google Pixel ──────────────────────────────────────────────────────
    m("model-pixel-6a",         "Google", "Pixel 6a",           "128 GB", phone, "2022-07-28", 43_999, 18_000, 8_000,  low),
    m("model-pixel-7-128",      "Google", "Pixel 7",            "128 GB", phone, "2022-10-13", 59_999, 30_000, 12_000, low),
    m("model-pixel-7-256",      "Google", "Pixel 7",            "256 GB", phone, "2022-10-13", 65_999, 34_000, 14_000, low),
    m("model-pixel-7-pro",      "Google", "Pixel 7 Pro",        "128 GB", phone, "2022-10-13", 84_999, 38_000, 16_000, low),
    m("model-pixel-7a",         "Google", "Pixel 7a",           "128 GB", phone, "2023-05-10", 43_999, 22_000, 9_000,  medium),
    m("model-pixel-8-128",      "Google", "Pixel 8",            "128 GB", phone, "2023-10-12", 75_999, 42_000, 18_000, medium),
    m("model-pixel-8-256",      "Google", "Pixel 8",            "256 GB", phone, "2023-10-12", 85_999, 48_000, 22_000, medium),
    m("model-pixel-8-pro",      "Google", "Pixel 8 Pro",        "256 GB", phone, "2023-10-12", 106_999, 60_000, 25_000, medium),
    m("model-pixel-8a",         "Google", "Pixel 8a",           "128 GB", phone, "2024-05-14", 52_999, 35_000, 15_000, medium),
    m("model-pixel-9",          "Google", "Pixel 9",            "128 GB", phone, "2024-08-22", 79_999, 60_000, 28_000, medium),
    m("model-pixel-9-pro",      "Google", "Pixel 9 Pro",        "256 GB", phone, "2024-08-22", 109_999, 80_000, 38_000, medium),

    // ── Xiaomi / Redmi / POCO ─────────────────────────────────────────────
    m("model-redmi-note-12",    "Xiaomi", "Redmi Note 12 5G",   "128 GB", phone, "2023-01-30", 17_999, 8_000,  3_500,  high),
    m("model-redmi-note-12-pro","Xiaomi", "Redmi Note 12 Pro 5G","128 GB",phone, "2023-01-10", 24_999, 12_000, 5_000,  high),
    m("model-redmi-note-13",    "Xiaomi", "Redmi Note 13 5G",   "128 GB", phone, "2024-01-10", 17_999, 10_000, 4_500,  high),
    m("model-redmi-note-13-pro","Xiaomi", "Redmi Note 13 Pro 5G","128 GB",phone, "2024-01-10", 24_999, 15_000, 6_500,  high),
    m("model-redmi-note-13-proplus","Xiaomi","Redmi Note 13 Pro+ 5G","256 GB",phone,"2024-01-10",31_999,18_000,8_000,high),
    m("model-xiaomi-13-pro",    "Xiaomi", "13 Pro",             "256 GB", phone, "2023-02-26", 79_999, 38_000, 17_000, medium),
    m("model-xiaomi-14",        "Xiaomi", "14",                 "256 GB", phone, "2024-03-07", 69_999, 45_000, 20_000, medium),
    m("model-xiaomi-14-ultra",  "Xiaomi", "14 Ultra",           "512 GB", phone, "2024-04-09", 99_999, 62_000, 28_000, low),
    m("model-poco-f5",          "Xiaomi", "POCO F5 5G",         "256 GB", phone, "2023-05-09", 29_999, 16_000, 7_000,  medium),
    m("model-poco-x5-pro",      "Xiaomi", "POCO X5 Pro 5G",    "128 GB", phone, "2023-02-06", 22_999, 11_000, 5_000,  medium),
    m("model-poco-x6-pro",      "Xiaomi", "POCO X6 Pro 5G",    "256 GB", phone, "2024-01-11", 24_999, 16_000, 7_000,  medium),
    m("model-redmi-13c",        "Xiaomi", "Redmi 13C",          "128 GB", phone, "2023-12-06", 10_999, 5_500,  2_500,  high),
    m("model-redmi-a3",         "Xiaomi", "Redmi A3",           "64 GB",  phone, "2024-02-20", 7_499,  3_500,  1_500,  high),

    // ── Vivo ──────────────────────────────────────────────────────────────
    m("model-vivo-v27-pro",     "Vivo", "V27 Pro 5G",           "128 GB", phone, "2023-03-01", 37_999, 18_000, 8_000,  medium),
    m("model-vivo-v29",         "Vivo", "V29 5G",               "128 GB", phone, "2023-08-24", 33_999, 18_000, 8_000,  medium),
    m("model-vivo-v30",         "Vivo", "V30 5G",               "128 GB", phone, "2024-03-07", 33_999, 22_000, 10_000, medium),
    m("model-vivo-v30-pro",     "Vivo", "V30 Pro 5G",           "128 GB", phone, "2024-03-14", 39_999, 26_000, 12_000, medium),
    m("model-vivo-x100",        "Vivo", "X100 5G",              "256 GB", phone, "2024-01-18", 63_999, 38_000, 17_000, low),
    m("model-vivo-x100-pro",    "Vivo", "X100 Pro 5G",          "256 GB", phone, "2024-03-07", 89_999, 52_000, 24_000, low),
    m("model-vivo-t2x",         "Vivo", "T2x 5G",              "128 GB", phone, "2023-05-15", 12_999, 6_000,  2_500,  high),
    m("model-vivo-y100",        "Vivo", "Y100 5G",              "128 GB", phone, "2023-08-31", 19_999, 10_000, 4_500,  medium),

    // ── OPPO ──────────────────────────────────────────────────────────────
    m("model-oppo-reno-10",     "OPPO", "Reno10 5G",            "128 GB", phone, "2023-07-19", 32_999, 16_000, 7_000,  medium),
    m("model-oppo-reno-10-pro", "OPPO", "Reno10 Pro 5G",        "128 GB", phone, "2023-07-19", 39_999, 20_000, 9_000,  medium),
    m("model-oppo-reno-11",     "OPPO", "Reno11 5G",            "128 GB", phone, "2024-01-12", 29_999, 20_000, 9_000,  medium),
    m("model-oppo-reno-11-pro", "OPPO", "Reno11 Pro 5G",        "256 GB", phone, "2024-01-12", 39_999, 26_000, 12_000, medium),
    m("model-oppo-find-x6-pro", "OPPO", "Find X6 Pro",          "256 GB", phone, "2023-03-21", 89_999, 42_000, 19_000, low),
    m("model-oppo-a78",         "OPPO", "A78 5G",               "128 GB", phone, "2023-02-15", 18_999, 8_000,  3_500,  high),
    m("model-oppo-a79",         "OPPO", "A79 5G",               "128 GB", phone, "2023-11-30", 17_999, 10_000, 4_500,  high),

    // ── Realme ────────────────────────────────────────────────────────────
    m("model-realme-11-pro",    "Realme", "11 Pro 5G",           "128 GB", phone, "2023-06-20", 24_999, 12_000, 5_000,  medium),
    m("model-realme-11-proplus","Realme", "11 Pro+ 5G",          "256 GB", phone, "2023-06-20", 29_999, 16_000, 7_000,  medium),
    m("model-realme-12-pro",    "Realme", "12 Pro 5G",           "128 GB", phone, "2024-01-29", 23_999, 16_000, 7_000,  medium),
    m("model-realme-12-proplus","Realme", "12 Pro+ 5G",          "256 GB", phone, "2024-01-29", 29_999, 20_000, 9_000,  medium),
    m("model-realme-gt5-pro",   "Realme", "GT 5 Pro",            "256 GB", phone, "2024-01-16", 39_999, 28_000, 12_000, medium),
    m("model-realme-narzo-60",  "Realme", "Narzo 60 5G",         "128 GB", phone, "2023-07-06", 14_999, 7_000,  3_000,  high),
    m("model-realme-c55",       "Realme", "C55",                 "64 GB",  phone, "2023-03-28", 10_999, 5_000,  2_000,  high),

    // ── Nothing ───────────────────────────────────────────────────────────
    m("model-nothing-phone-1",  "Nothing", "Phone (1)",          "128 GB", phone, "2022-07-12", 32_999, 16_000, 7_000,  low),
    m("model-nothing-phone-1-256","Nothing","Phone (1)",         "256 GB", phone, "2022-07-12", 35_999, 18_000, 8_000,  low),
    m("model-nothing-phone-2",  "Nothing", "Phone (2)",          "128 GB", phone, "2023-07-11", 44_999, 25_000, 10_000, medium),
    m("model-nothing-phone-2-256","Nothing","Phone (2)",         "256 GB", phone, "2023-07-11", 49_999, 28_000, 12_000, medium),
    m("model-nothing-phone-2a", "Nothing", "Phone (2a)",         "128 GB", phone, "2024-03-05", 23_999, 16_000, 7_000,  medium),

    // ── iQOO ──────────────────────────────────────────────────────────────
    m("model-iqoo-12",          "iQOO", "12 5G",                "256 GB", phone, "2024-01-02", 52_999, 32_000, 14_000, medium),
    m("model-iqoo-neo-9-pro",   "iQOO", "Neo 9 Pro 5G",        "128 GB", phone, "2024-02-22", 36_999, 24_000, 10_000, medium),
    m("model-iqoo-z7-pro",      "iQOO", "Z7 Pro 5G",           "128 GB", phone, "2023-08-31", 23_999, 12_000, 5_000,  medium),
    m("model-iqoo-z9",          "iQOO", "Z9 5G",               "128 GB", phone, "2024-03-12", 17_999, 12_000, 5_000,  medium),

    // ── Motorola ──────────────────────────────────────────────────────────
    m("model-moto-edge-40",     "Motorola", "Edge 40",          "128 GB", phone, "2023-05-25", 29_999, 15_000, 6_500,  low),
    m("model-moto-edge-50-pro", "Motorola", "Edge 50 Pro",      "256 GB", phone, "2024-04-02", 35_999, 24_000, 10_000, low),
    m("model-moto-g84",         "Motorola", "Moto G84 5G",      "128 GB", phone, "2023-09-01", 19_999, 10_000, 4_500,  medium),
    m("model-moto-razr-40",     "Motorola", "Razr 40",          "128 GB", phone, "2023-06-01", 39_999, 20_000, 9_000,  low),

    // ── Apple iPad ────────────────────────────────────────────────────────
    m("model-ipad-10",          "Apple", "iPad (10th Gen)",     "64 GB",  tablet, "2022-10-26", 44_900,  28_000, 12_000, medium),
    m("model-ipad-10-256",      "Apple", "iPad (10th Gen)",     "256 GB", tablet, "2022-10-26", 54_900,  34_000, 15_000, medium),
    m("model-ipad-air-m2",      "Apple", "iPad Air M2",         "256 GB", tablet, "2024-05-15", 69_900,  52_000, 22_000, medium),
    m("model-ipad-pro-m4",      "Apple", "iPad Pro M4",         "256 GB", tablet, "2024-05-15", 99_900,  78_000, 38_000, medium),
    m("model-ipad-mini-6",      "Apple", "iPad Mini (6th Gen)", "64 GB",  tablet, "2021-09-24", 46_900,  28_000, 12_000, medium),

    // ── Samsung tablets ───────────────────────────────────────────────────
    m("model-tab-s9",           "Samsung", "Galaxy Tab S9",      "128 GB", tablet, "2023-07-26", 74_999, 42_000, 18_000, low),
    m("model-tab-s9-fe",        "Samsung", "Galaxy Tab S9 FE",   "128 GB", tablet, "2023-10-04", 44_999, 26_000, 11_000, low),
    m("model-tab-a9",           "Samsung", "Galaxy Tab A9",      "64 GB",  tablet, "2023-09-20", 13_999, 7_000,  3_000,  medium),

    // ── Apple MacBooks ────────────────────────────────────────────────────
    m("model-macbook-air-m1",   "Apple", "MacBook Air M1",       "256 GB", laptop, "2020-11-17", 92_900,  52_000, 25_000, medium),
    m("model-macbook-air-m2",   "Apple", "MacBook Air M2",       "256 GB", laptop, "2022-07-15", 119_900, 78_000, 35_000, medium),
    m("model-macbook-air-m2-512","Apple","MacBook Air M2",       "512 GB", laptop, "2022-07-15", 149_900, 95_000, 45_000, medium),
    m("model-macbook-air-m3",   "Apple", "MacBook Air M3",       "256 GB", laptop, "2024-03-08", 114_900, 90_000, 42_000, medium),
    m("model-macbook-pro-14-m3","Apple", "MacBook Pro 14 M3",    "512 GB", laptop, "2023-11-07", 169_900, 120_000, 55_000, medium),
    m("model-macbook-pro-16-m3","Apple", "MacBook Pro 16 M3 Pro","512 GB", laptop, "2023-11-07", 249_900, 175_000, 85_000, low),
  ];

  for (const dm of deviceModels) {
    const { id, ...data } = dm;
    await prisma.deviceModel.upsert({
      where: { id },
      update: data,
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
      update: {
        full_name: acct.fullName,
        app_role: acct.appRole,
        active_mode: acct.activeMode,
        hub_id: acct.hubId ?? null,
        is_platform_admin: acct.isPlatformAdmin ?? false,
      },
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
      { modelId: "model-iphone-14-128", grade: "B" as const, colour: "Blue", imei: "353456789012346", tag: "CB-BLR-002", hub: "hub-indiranagar", option: "sell_for_more" as const },
      { modelId: "model-iphone-13-128", grade: "A" as const, colour: "Midnight", imei: "353456789012347", tag: "CB-BLR-003", hub: "hub-koramangala", option: "instant_cash" as const },
      { modelId: "model-galaxy-s24-ultra", grade: "A" as const, colour: "Titanium Yellow", imei: "353456789012348", tag: "CB-BLR-004", hub: "hub-indiranagar", option: "sell_for_more" as const },
      { modelId: "model-galaxy-s24-ultra", grade: "B" as const, colour: "Titanium Grey", imei: "353456789012349", tag: "CB-BLR-005", hub: "hub-koramangala", option: "sell_for_more" as const },
      { modelId: "model-galaxy-s23-128", grade: "A" as const, colour: "Phantom Black", imei: "353456789012350", tag: "CB-BLR-006", hub: "hub-indiranagar", option: "instant_cash" as const },
      { modelId: "model-galaxy-s23-128", grade: "C" as const, colour: "Green", imei: "353456789012351", tag: "CB-BLR-007", hub: "hub-koramangala", option: "sell_for_more" as const },
      { modelId: "model-pixel-8-pro", grade: "A" as const, colour: "Bay", imei: "353456789012352", tag: "CB-BLR-008", hub: "hub-indiranagar", option: "sell_for_more" as const },
      { modelId: "model-pixel-7-128", grade: "B" as const, colour: "Obsidian", imei: "353456789012353", tag: "CB-BLR-009", hub: "hub-koramangala", option: "instant_cash" as const },
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
