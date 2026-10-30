import { InstallJsxFramework } from "../../components/InstallJsxFramework";

export default function InstallSolidJs() {
  return (
    <InstallJsxFramework
      name="SolidJS"
      viteImport='import solidPlugin from "vite-plugin-solid";'
      vitePlugin="solidPlugin"
    />
  );
}
