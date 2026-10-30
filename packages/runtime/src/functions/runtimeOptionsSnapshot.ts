import { strictConfig } from "@locator/shared";

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
