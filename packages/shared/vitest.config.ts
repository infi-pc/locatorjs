import { noWebStoragePoolOptions } from "@locator/dev-config/vitest-no-webstorage.js";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    poolOptions: noWebStoragePoolOptions(),
  },
});
