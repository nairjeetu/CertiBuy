import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const buyingSource = readFileSync(resolve(__dirname, "buying.ts"), "utf-8");

describe("cancelOrder invariants (§11.2)", () => {
  it("must not touch payout records — a cancellation never reverses a seller payout", () => {
    const fnStart = buyingSource.indexOf("export async function cancelOrder");
    const fnEnd = buyingSource.indexOf("export async function", fnStart + 1);
    const body = buyingSource.slice(fnStart, fnEnd === -1 ? undefined : fnEnd);

    expect(body).not.toContain("tx.payout");
    expect(body).not.toContain("payout.update");
    expect(body).not.toContain("payout.updateMany");
  });

  it("must not reference change_mind_fee — that deduction applies to returns only", () => {
    const fnStart = buyingSource.indexOf("export async function cancelOrder");
    const fnEnd = buyingSource.indexOf("export async function", fnStart + 1);
    const body = buyingSource.slice(fnStart, fnEnd === -1 ? undefined : fnEnd);

    expect(body).not.toContain("change_mind_fee");
    expect(body).not.toContain("change_of_mind");
  });
});
