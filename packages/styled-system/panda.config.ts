import { defineConfig } from "@pandacss/dev";
import { preset } from "./preset";

export default defineConfig({
  presets: [preset],
  outdir: "dist",
  importMap: "@locator/styled-system",
  jsxFramework: "solid",
  include: [],
  preflight: true,
});
