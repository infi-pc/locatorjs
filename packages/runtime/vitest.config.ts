import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";
import { noWebStoragePoolOptions } from "@locator/dev-config/vitest-no-webstorage.js";

export default defineConfig({
  plugins: [solid()],
  css: {
    postcss: {
      plugins: [],
    },
  },
  resolve: {
    conditions: ["browser", "development"],
  },
  test: {
    poolOptions: noWebStoragePoolOptions(),
    server: {
      deps: {
        inline: ["@locator/ui", "@ark-ui/solid"],
      },
    },
  },
});
