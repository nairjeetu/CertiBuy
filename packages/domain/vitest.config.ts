import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@certibuy/contracts": path.resolve(__dirname, "../contracts/src"),
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
    globals: false,
  },
});
