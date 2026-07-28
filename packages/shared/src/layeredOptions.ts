import type { Targets } from "./index";

export type LocatorOptions = {
  targetId?: string;
  targetTemplate?: string;
  adapterId?: string;
  projectPath?: string;
  replacePath?: { from: string; to: string };
  mouseModifiers?: string;
  hrefTarget?: "_blank" | "_self";
  tmuxSession?: string;
  disabled?: boolean;
  debugMode?: boolean;
  showIntro?: boolean;
};

export type LocatorUserOriginStored = LocatorOptions & {
  uiState?: { welcomeScreenDismissed?: boolean };
};

export type LocatorLayer =
  | "default"
  | "team"
  | "user-extension"
  | "user-origin";

export const LAYER_ORDER: LocatorLayer[] = [
  "default",
  "team",
  "user-extension",
  "user-origin",
];

export const DEFAULT_LAYER: LocatorOptions = {
  mouseModifiers: "alt",
  hrefTarget: "_self",
  disabled: false,
  debugMode: false,
};

export type ResolveResult = {
  effective: LocatorOptions;
  provenance: Partial<Record<keyof LocatorOptions, LocatorLayer>>;
};

// targetId and targetTemplate are two forms of one choice ("which target"),
// so a layer that sets either one overrides both from lower layers — otherwise
// a team-set template could never be overridden by a user picking a targetId.
const TARGET_KEYS = ["targetId", "targetTemplate"] as const;

export function resolve(
  layers: Partial<Record<LocatorLayer, LocatorOptions>>
): ResolveResult {
  const effective: LocatorOptions = {};
  const provenance: Partial<Record<keyof LocatorOptions, LocatorLayer>> = {};

  for (const layer of LAYER_ORDER) {
    const source = layers[layer];
    if (!source) continue;

    if (TARGET_KEYS.some((key) => source[key] !== undefined)) {
      for (const key of TARGET_KEYS) {
        delete effective[key];
        delete provenance[key];
      }
    }

    for (const rawKey of Object.keys(source) as (keyof LocatorOptions)[]) {
      const value = source[rawKey];
      if (value === undefined) continue;
      (effective as Record<string, unknown>)[rawKey] = value;
      provenance[rawKey] = layer;
    }
  }

  return { effective, provenance };
}

export type ResolvedTarget =
  | { kind: "template"; url: string }
  | { kind: "targetId"; id: string; url: string }
  | {
      kind: "fallback";
      id: string;
      url: string;
      reason: "unknown-id" | "none-selected" | "empty";
    };

export function resolveTarget(
  effective: LocatorOptions,
  targets: Targets
): ResolvedTarget {
  if (effective.targetTemplate) {
    return { kind: "template", url: effective.targetTemplate };
  }
  if (effective.targetId && targets[effective.targetId]) {
    return {
      kind: "targetId",
      id: effective.targetId,
      url: targets[effective.targetId]!.url,
    };
  }
  const firstEntry = Object.entries(targets)[0];
  if (!firstEntry) {
    return { kind: "fallback", id: "", url: "", reason: "empty" };
  }
  const [firstId, firstTarget] = firstEntry;
  return {
    kind: "fallback",
    id: firstId,
    url: firstTarget.url,
    reason: effective.targetId ? "unknown-id" : "none-selected",
  };
}
