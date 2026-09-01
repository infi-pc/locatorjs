import { strictConfig } from "@locator/shared";
import { initRuntime } from "./initRuntime";
import { isExtension } from "./functions/isExtension";
import { replaceTeamConfig } from "./functions/teamLayerStore";
import { installShadowRootTracking } from "./functions/shadowRoots";
import { readEffectiveRuntimeOptions } from "./functions/runtimeOptionsSnapshot";
export * from "./adapters/jsx/runtimeStore";
export { MAX_ZINDEX } from "./consts";

if (typeof window !== "undefined" && isExtension()) {
  setTimeout(() => initRuntime(), 0);
}

export type SetupOptions = strictConfig.LocatorConfigInput;
export type SetupResult = strictConfig.SetupResult;

export function setup(options: SetupOptions = {}): SetupResult {
  const compiled = strictConfig.compileSetup(options);
  if (!compiled.ok) {
    return Object.freeze({ ok: false, errors: compiled.errors });
  }

  replaceTeamConfig(compiled.value);

  if (!readEffectiveRuntimeOptions().disabled) installShadowRootTracking();

  setTimeout(() => initRuntime(), 0);
  return Object.freeze({ ok: true });
}

export default setup;
