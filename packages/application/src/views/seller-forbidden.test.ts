import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SELLER_FORBIDDEN_FIELDS } from "@certibuy/contracts";

const sellerViewSource = readFileSync(
  resolve(__dirname, "seller.ts"),
  "utf-8",
);

describe("seller view forbidden-field scan", () => {
  for (const field of SELLER_FORBIDDEN_FIELDS) {
    it(`must not expose "${field}" in any seller view`, () => {
      const lines = sellerViewSource.split("\n");
      const violations: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trimStart().startsWith("//")) continue;
        if (line.trimStart().startsWith("import ")) continue;
        if (line.includes("SELLER_FORBIDDEN_FIELDS")) continue;
        if (line.includes(field)) {
          violations.push(`line ${i + 1}: ${line.trim()}`);
        }
      }
      expect(violations, `"${field}" found in seller views`).toEqual([]);
    });
  }
});
