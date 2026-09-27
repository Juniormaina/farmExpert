import { defineConfig } from "vitest/config";

export default defineConfig({
  ssr: {
    external: ["node:sqlite", "sqlite"]
  },
  optimizeDeps: {
    exclude: ["node:sqlite", "sqlite"]
  },
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup-env.ts", "tests/setup-db.ts"],
    server: {
      deps: {
        external: [/node:sqlite/, /^sqlite$/]
      }
    }
  }
});
