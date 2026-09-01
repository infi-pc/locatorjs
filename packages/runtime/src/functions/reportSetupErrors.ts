import { strictConfig } from "@locator/shared";

/**
 * `setup()` returned void before v2, so callers carried over from v1 do not
 * inspect the v2 result. Without a console report the only symptom of a
 * rejected configuration is that nothing changes, which is indistinguishable
 * from a broken install.
 *
 * The message deliberately claims nothing about whether LocatorJS is running:
 * an earlier `setup()` may have been accepted, and inside the extension the
 * runtime starts without one. All that is certain is that this call applied
 * nothing.
 */
export function reportSetupErrors(
  errors: readonly strictConfig.ConfigError[]
): void {
  const detail = errors
    .map((error) => `  ${error.path} (${error.code}): ${error.message}`)
    .join("\n");
  console.error(
    `LocatorJS: setup() rejected the configuration. No part of it was applied.\n${detail}`
  );
}
