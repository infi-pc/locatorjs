import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      "@locator/ui": fileURLToPath(
        new URL("../../packages/ui/src/index.ts", import.meta.url)
      ),
      "@locator/shared": fileURLToPath(
        new URL("../../packages/shared/src/index.ts", import.meta.url)
      ),
    },
  },
  build: {
    target: "esnext",
  },
});
