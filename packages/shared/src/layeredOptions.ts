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
  experimentalFeatures?: boolean;
  showIntro?: boolean;
};

export type LocatorUserProjectStored = LocatorOptions & {
  uiState?: { welcomeScreenDismissed?: boolean };
};

export type LocatorLayer =
  | "default"
  | "team"
  | "user-extension"
  | "user-project";

export const LAYER_ORDER: LocatorLayer[] = [
  "default",
  "team",
  "user-extension",
  "user-project",
];

export const DEFAULT_LAYER: LocatorOptions = {
  mouseModifiers: "alt",
  hrefTarget: "_self",
  disabled: false,
  debugMode: false,
  experimentalFeatures: false,
};

export type ResolveResult = {
  effective: LocatorOptions;
  provenance: Partial<Record<keyof LocatorOptions, LocatorLayer>>;
};

export function resolve(
  layers: Partial<Record<LocatorLayer, LocatorOptions>>
): ResolveResult {
  const effective: LocatorOptions = {};
  const provenance: Partial<Record<keyof LocatorOptions, LocatorLayer>> = {};

  for (const layer of LAYER_ORDER) {
    const source = layers[layer];
    if (!source) continue;
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
      reason: "unknown-id" | "empty";
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
    reason: effective.targetId ? "unknown-id" : "empty",
  };
}
