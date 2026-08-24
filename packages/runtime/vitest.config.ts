import { defineConfig } from "vitest/config";
import { noWebStoragePoolOptions } from "@locator/dev-config/vitest-no-webstorage.js";

export default defineConfig({
  resolve: {
    conditions: ["browser", "development"],
  },
  test: {
    poolOptions: noWebStoragePoolOptions(),
  },
});
