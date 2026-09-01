import { strictConfig, strictConfigStorage } from "@locator/shared";
import { getTeamConfig } from "./teamLayerStore";

export function readUserExtensionGlobal():
  | strictConfig.LocatorLayer
  | undefined {
  if (typeof document === "undefined") return undefined;
  const raw = document.documentElement?.dataset?.locatorUserExtensionOptions;
  if (!raw) return undefined;
  try {
    const parsed = strictConfig.parseLayer(JSON.parse(raw));
    return parsed.ok ? parsed.value : undefined;
  } catch {
    return undefined;
  }
}

/** Synchronous settings snapshot used by the pre-UI activation shell. */
export function readEffectiveRuntimeOptions(): strictConfig.EffectiveOptions {
  const team = getTeamConfig();
  const userRead = strictConfigStorage.readUserConfig();
  const user = strictConfigStorage.snapshotFromRead(userRead);
  return strictConfig.effectiveOptions(
    strictConfig.resolveConfig(
      {
        default: strictConfig.DEFAULT_LAYER,
        team: team.layer,
        "user-extension": readUserExtensionGlobal(),
        ...(user ? { "user-origin": user.layer } : {}),
      },
      team.targets
    )
  );
}
