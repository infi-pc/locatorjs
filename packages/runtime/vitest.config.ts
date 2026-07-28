import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    conditions: ["browser", "development"],
  },
});
