import { canonicalModifiers } from "./modifiers";
import { LOCATOR_OPTION_KEYS } from "./optionsCodec";
import type { Targets } from "./targets";
import { isSafeTargetTemplate } from "./targetTemplate";

export type PromptApp = "cursor" | "windsurf";

/**
 * Where source links open. Used by the global `editor` option and, as an
 * override, by individual `open-editor` actions.
 */
export type EditorSelection = {
  targetId?: string;
  targetTemplate?: string;
};

export type BindingAction =
  | { kind: "open-editor"; targetId?: string; targetTemplate?: string }
  | { kind: "copy-path" }
  | { kind: "copy-prompt"; template?: string }
  | { kind: "open-prompt"; app: PromptApp; template?: string }
  | { kind: "show-tree" }
  | { kind: "show-parents" };

export type BindingTrigger =
  | { kind: "modifier-click"; modifiers: string }
  | { kind: "hover-toolbar" };

export type Binding = {
  trigger: BindingTrigger;
  action: BindingAction;
};

export type LocatorOptions = {
  adapterId?: string;
  projectPath?: string;
  replacePath?: { from: string; to: string };
  /**
   * The single destination every source link opens in, unless an individual
   * `open-editor` action overrides it. Atomic: a layer that sets it replaces
   * both fields from lower layers.
   */
  editor?: EditorSelection;
  bindings?: Binding[];
  /** @deprecated Use bindings instead. Kept as an input for compatibility. */
  mouseModifiers?: string;
  hrefTarget?: "_blank" | "_self";
  tmuxSession?: string;
  disabled?: boolean;
  debugMode?: boolean;
  showIntro?: boolean;
};

export type LocatorUserOriginStored = LocatorOptions & {
  uiState?: {
    welcomeScreenDismissed?: boolean;
    onboarding?: { dismissed?: boolean; step?: string };
  };
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
  editor: { targetId: "vscode" },
  bindings: [
    {
      trigger: { kind: "modifier-click", modifiers: "alt" },
      action: { kind: "open-editor" },
    },
    { trigger: { kind: "hover-toolbar" }, action: { kind: "show-tree" } },
    {
      trigger: { kind: "hover-toolbar" },
      action: { kind: "show-parents" },
    },
    { trigger: { kind: "hover-toolbar" }, action: { kind: "copy-path" } },
  ],
  hrefTarget: "_self",
  disabled: false,
  debugMode: false,
};

export const PROMPT_TEMPLATE_VARIABLES = [
  "filePath",
  "projectPath",
  "line",
  "column",
  "componentName",
  "componentTree",
  "htmlSnippet",
  "elementLabel",
] as const;

export const DEFAULT_PROMPT_TEMPLATE = `Please help me update this UI element.

File: \${filePath}:\${line}:\${column}
Component: \${componentName}
Component tree: \${componentTree}
Element: \${elementLabel}

\${htmlSnippet}`;

export type ResolveResult = {
  effective: LocatorOptions;
  provenance: Partial<Record<keyof LocatorOptions, LocatorLayer>>;
};

const BINDING_KEYS = ["bindings", "mouseModifiers"] as const;

const DEFAULT_ICON_BINDINGS: Binding[] = [
  { trigger: { kind: "hover-toolbar" }, action: { kind: "show-tree" } },
  {
    trigger: { kind: "hover-toolbar" },
    action: { kind: "show-parents" },
  },
  { trigger: { kind: "hover-toolbar" }, action: { kind: "copy-path" } },
];

/**
 * Rewrites every shortcut into the canonical modifier order, so downstream
 * comparisons of the raw string are sound. Returns the same array when nothing
 * changed, to keep this cheap for the memos that call it on every resolve.
 */
function canonicalizeBindings(bindings: Binding[]): Binding[] {
  let changed = false;
  const next = bindings.map((binding) => {
    if (binding.trigger.kind !== "modifier-click") return binding;
    const modifiers = canonicalModifiers(binding.trigger.modifiers);
    if (modifiers === binding.trigger.modifiers) return binding;
    changed = true;
    return { ...binding, trigger: { ...binding.trigger, modifiers } };
  });
  return changed ? next : bindings;
}

/**
 * Converts a legacy layer to the bindings schema. This is intentionally pure
 * so it can be used for in-memory resolution as well as lazy persistence.
 */
export function normalizeLayer(options: LocatorOptions = {}): LocatorOptions {
  const actionOwnedOptions = { ...options } as LocatorOptions & {
    targetId?: string;
    targetTemplate?: string;
    promptTemplate?: string;
  };
  delete actionOwnedOptions.targetId;
  delete actionOwnedOptions.targetTemplate;
  delete actionOwnedOptions.promptTemplate;

  if (actionOwnedOptions.bindings !== undefined) {
    const bindings = canonicalizeBindings(actionOwnedOptions.bindings);
    if (
      actionOwnedOptions.mouseModifiers === undefined &&
      bindings === actionOwnedOptions.bindings
    ) {
      return actionOwnedOptions;
    }
    const normalized = { ...actionOwnedOptions, bindings };
    delete normalized.mouseModifiers;
    return normalized;
  }
  if (actionOwnedOptions.mouseModifiers === undefined)
    return actionOwnedOptions;

  const { mouseModifiers, ...normalized } = actionOwnedOptions;
  return {
    ...normalized,
    bindings: [
      ...(mouseModifiers
        ? [
            {
              trigger: {
                kind: "modifier-click" as const,
                modifiers: canonicalModifiers(mouseModifiers),
              },
              action: { kind: "open-editor" } as const,
            },
          ]
        : []),
      ...DEFAULT_ICON_BINDINGS.map((binding) => ({
        ...binding,
        action: { ...binding.action },
      })),
    ],
  };
}

export function resolve(
  layers: Partial<Record<LocatorLayer, LocatorOptions>>
): ResolveResult {
  const effective: LocatorOptions = {};
  const provenance: Partial<Record<keyof LocatorOptions, LocatorLayer>> = {};

  for (const layer of LAYER_ORDER) {
    const rawSource = layers[layer];
    if (!rawSource) continue;
    const source = normalizeLayer(rawSource);

    if (BINDING_KEYS.some((key) => source[key] !== undefined)) {
      for (const key of BINDING_KEYS) {
        delete effective[key];
        delete provenance[key];
      }
    }

    for (const rawKey of LOCATOR_OPTION_KEYS) {
      const value = source[rawKey];
      if (value === undefined) continue;
      (effective as Record<string, unknown>)[rawKey] = value;
      provenance[rawKey] = layer;
    }
  }

  return { effective, provenance };
}

/**
 * True when the action pins its own destination instead of following the
 * global Editor setting.
 */
export function hasEditorOverride(
  action: Extract<BindingAction, { kind: "open-editor" }>
): boolean {
  return Boolean(action.targetId || action.targetTemplate);
}

/**
 * Resolves where an `open-editor` action opens: its own override when it has
 * one, otherwise the global Editor setting.
 */
export function resolveBindingTarget(
  action: Extract<BindingAction, { kind: "open-editor" }>,
  targets: Targets,
  editor?: EditorSelection
): ResolvedTarget {
  if (hasEditorOverride(action)) {
    return resolveTarget(action, targets);
  }
  return resolveEditorTarget(editor, targets);
}

/** Resolves the global Editor setting. */
export function resolveEditorTarget(
  editor: EditorSelection | undefined,
  targets: Targets
): ResolvedTarget {
  return resolveTarget(editor ?? {}, targets);
}

/**
 * True when a resolved target is a guess rather than a choice, so callers can
 * ask the user to pick an editor instead of opening a link that goes nowhere.
 */
export function needsEditorSetup(resolved: ResolvedTarget): boolean {
  return resolved.kind === "fallback";
}

/**
 * The modifier-click shortcut that opens the editor, if there is one.
 *
 * Distinct from `primaryEditorBinding`, which falls back to a toolbar button:
 * "which action opens the editor" and "which shortcut opens the editor" are
 * different questions, and answering the second with the first is what made
 * the intro banner advertise an Alt+click that does nothing.
 */
export function primaryEditorShortcut(
  bindings: Binding[] | undefined
): Binding | undefined {
  return bindings?.find(
    (binding) =>
      binding.trigger.kind === "modifier-click" &&
      binding.action.kind === "open-editor"
  );
}

/** Any binding that opens the editor, shortcut or toolbar button. */
export function primaryEditorBinding(
  bindings: Binding[] | undefined
): Binding | undefined {
  return (
    primaryEditorShortcut(bindings) ??
    bindings?.find((binding) => binding.action.kind === "open-editor")
  );
}

export type ResolvedTarget =
  | { kind: "template"; url: string }
  | { kind: "targetId"; id: string; url: string }
  | {
      kind: "fallback";
      id: string;
      url: string;
      reason: "unknown-id" | "none-selected" | "empty" | "unsafe-template";
    };

export function resolveTarget(
  effective: { targetId?: string; targetTemplate?: string },
  targets: Targets
): ResolvedTarget {
  if (effective.targetTemplate) {
    if (isSafeTargetTemplate(effective.targetTemplate)) {
      return { kind: "template", url: effective.targetTemplate };
    }
    const firstEntry = Object.entries(targets)[0];
    return firstEntry
      ? {
          kind: "fallback",
          id: firstEntry[0],
          url: firstEntry[1].url,
          reason: "unsafe-template",
        }
      : { kind: "fallback", id: "", url: "", reason: "empty" };
  }
  const selectedTarget = effective.targetId
    ? targets[effective.targetId]
    : undefined;
  if (effective.targetId && selectedTarget) {
    return {
      kind: "targetId",
      id: effective.targetId,
      url: selectedTarget.url,
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
