import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["lib/**/*.test.ts", "app/**/*.test.tsx"],
    mockReset: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
