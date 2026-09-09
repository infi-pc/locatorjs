import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";
import { noWebStoragePoolOptions } from "@locator/dev-config/vitest-no-webstorage.js";

export default defineConfig({
  plugins: [solid()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    poolOptions: noWebStoragePoolOptions(),
  },
});
