import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

export default defineConfig({
  resolve: {
    alias: {
      // Neutralize the `server-only` guard in unit tests; it exists to protect
      // the browser bundle, which is irrelevant under Node-based Vitest.
      "server-only": fileURLToPath(
        new URL("./test/stubs/server-only.ts", import.meta.url)
      ),
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
