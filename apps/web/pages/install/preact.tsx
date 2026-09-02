import { InstallJsxFramework } from "../../components/InstallJsxFramework";

export default function InstallPreact() {
  return (
    <InstallJsxFramework
      name="Preact"
      viteImport='import preact from "@preact/preset-vite";'
      vitePlugin="preact"
    />
  );
}
