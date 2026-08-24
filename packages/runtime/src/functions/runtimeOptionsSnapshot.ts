import {
  DEFAULT_LAYER,
  decodeLocatorOptions,
  getUserOriginOptions,
  resolve,
  type LocatorOptions,
} from "@locator/shared";
import { getTeamLayerSignal } from "./teamLayerStore";

export function readUserExtensionGlobal(): LocatorOptions | undefined {
  if (typeof document === "undefined") return undefined;
  const raw = document.documentElement?.dataset?.locatorUserExtensionOptions;
  if (!raw) return undefined;
  try {
    return decodeLocatorOptions(JSON.parse(raw)) ?? undefined;
  } catch {
    return undefined;
  }
}

/** Synchronous settings snapshot used by the pre-UI activation shell. */
export function readEffectiveRuntimeOptions(): LocatorOptions {
  return resolve({
    default: DEFAULT_LAYER,
    team: getTeamLayerSignal()(),
    "user-extension": readUserExtensionGlobal(),
    "user-origin": getUserOriginOptions(),
  }).effective;
}
