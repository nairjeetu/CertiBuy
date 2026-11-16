import { describe, it, expect } from "vitest";
import { formatINR, roundToTen } from "./money.js";

describe("formatINR", () => {
  it("formats with Indian grouping", () => {
    const result = formatINR(132000);
    expect(result).toContain("₹");
    expect(result).toContain("1");
    expect(result).toContain("32");
    expect(result).toContain("000");
  });
});

describe("roundToTen", () => {
  it("rounds 51155 → 51160", () => {
    expect(roundToTen(51155)).toBe(51160);
  });

  it("rounds 51150 → 51150", () => {
    expect(roundToTen(51150)).toBe(51150);
  });

  it("rounds 51154 → 51150", () => {
    expect(roundToTen(51154)).toBe(51150);
  });

  it("rounds 48405 → 48410", () => {
    expect(roundToTen(48405)).toBe(48410);
  });
});
