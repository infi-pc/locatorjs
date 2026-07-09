import { defineConfig } from "@pandacss/dev";
import { preset } from "../styled-system/preset";

export default defineConfig({
  presets: [preset],
  outdir: "styled-system",
  importMap: "@locator/styled-system",
  jsxFramework: "solid",
  include: ["./src/**/*.{ts,tsx}", "../ui/src/**/*.{ts,tsx}"],
  preflight: false,
});
