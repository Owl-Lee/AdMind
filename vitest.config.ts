import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["app/**/*.test.ts", "packages/**/*.test.ts", "services/**/*.test.ts"],
    testTimeout: 10_000,
  },
});
