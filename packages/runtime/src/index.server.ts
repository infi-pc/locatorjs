import { strictConfig } from "@locator/shared";
import { reportSetupErrors } from "./functions/reportSetupErrors";

export { MAX_ZINDEX } from "./consts";

export type SetupOptions = strictConfig.LocatorConfigInput;
export type SetupResult = strictConfig.SetupResult;

export function setup(options: SetupOptions = {}): SetupResult {
  const compiled = strictConfig.compileSetup(options);
  if (!compiled.ok) {
    // A malformed config is a developer mistake wherever it is written, and
    // server rendering is often where it is written first.
    reportSetupErrors(compiled.errors);
    return Object.freeze({ ok: false, errors: compiled.errors });
  }
  // LocatorJS only has behavior in a browser. This entry point intentionally
  // stays inert when a framework resolves the package during server rendering.
  return Object.freeze({ ok: true });
}

export function getDataForDataId(_dataId: string) {
  void _dataId;
  return null;
}

export default setup;
