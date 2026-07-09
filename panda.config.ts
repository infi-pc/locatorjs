import { defineConfig } from "@pandacss/dev";
import { preset } from "./packages/styled-system/preset";

export default defineConfig({
  presets: [preset],
  outdir: "packages/styled-system/dist",
  importMap: "@locator/styled-system",
  jsxFramework: "solid",
  include: [
    "./apps/extension/src/**/*.{ts,tsx,jsx,js}",
    "./packages/runtime/src/**/*.{ts,tsx}",
    "./packages/ui/src/**/*.{ts,tsx}",
  ],
  preflight: true,
});
