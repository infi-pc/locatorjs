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

// `setup()` returned void before v2, so callers carried over from v1 do not
// inspect the result. Without a console report the only symptom of a rejected
// configuration is that LocatorJS never appears, which is indistinguishable
// from a broken install.
function reportSetupErrors(errors: readonly strictConfig.ConfigError[]) {
  const detail = errors
    .map((error) => `  ${error.path} (${error.code}): ${error.message}`)
    .join("\n");
  console.error(
    `LocatorJS: setup() rejected the configuration and did not start. ` +
      `The previous configuration, if any, is still active.\n${detail}`
  );
}

export function setup(options: SetupOptions = {}): SetupResult {
  const compiled = strictConfig.compileSetup(options);
  if (!compiled.ok) {
    reportSetupErrors(compiled.errors);
    return Object.freeze({ ok: false, errors: compiled.errors });
  }

  replaceTeamConfig(compiled.value);

  if (!readEffectiveRuntimeOptions().disabled) installShadowRootTracking();

  setTimeout(() => initRuntime(), 0);
  return Object.freeze({ ok: true });
}

export default setup;
