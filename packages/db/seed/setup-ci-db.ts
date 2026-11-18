import { PrismaClient } from "../src/generated/client";
import { readFileSync } from "fs";
import { resolve } from "path";

const db = new PrismaClient();

function splitStatements(sql: string): string[] {
  const stripped = sql
    .split("\n")
    .filter((line) => !line.trimStart().startsWith("--"))
    .join("\n");

  const results: string[] = [];
  let current = "";
  let inDollarQuote = false;

  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (ch === "$" && stripped[i + 1] === "$") {
      inDollarQuote = !inDollarQuote;
      current += "$$";
      i++;
      continue;
    }
    if (ch === ";" && !inDollarQuote) {
      const trimmed = current.trim();
      if (trimmed) results.push(trimmed);
      current = "";
      continue;
    }
    current += ch;
  }
  const trimmed = current.trim();
  if (trimmed) results.push(trimmed);
  return results;
}

async function main() {
  // Create the authenticated role (Supabase provides it, plain Postgres does not)
  try {
    await db.$executeRawUnsafe("CREATE ROLE authenticated NOLOGIN");
    console.log("Created 'authenticated' role.");
  } catch (e: any) {
    if (e.message.includes("already exists")) {
      console.log("'authenticated' role already exists.");
    } else {
      throw e;
    }
  }

  // Apply RLS policies
  const sql = readFileSync(
    resolve(__dirname, "../supabase/rls_policies.sql"),
    "utf-8"
  );

  const statements = splitStatements(sql);
  let ok = 0;
  let skipped = 0;

  for (const stmt of statements) {
    try {
      await db.$executeRawUnsafe(stmt);
      ok++;
    } catch (e: any) {
      if (
        e.message.includes("already exists") ||
        e.message.includes("already been enabled")
      ) {
        skipped++;
        continue;
      }
      console.error(`FAILED: ${stmt.substring(0, 120)}`);
      throw e;
    }
  }

  console.log(
    `RLS policies: ${ok} applied, ${skipped} skipped (already exist).`
  );
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
