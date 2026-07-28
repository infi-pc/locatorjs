import type { Targets } from "./index";

export type PromptApp = "cursor" | "windsurf";

export type BindingAction =
  | { kind: "open-editor"; targetId?: string; targetTemplate?: string }
  | { kind: "copy-path" }
  | { kind: "copy-prompt"; template?: string }
  | { kind: "open-prompt"; app: PromptApp; template?: string }
  | { kind: "show-tree" }
  | { kind: "show-parents" };

export type Binding = {
  modifiers?: string;
  icon?: boolean;
  action: BindingAction;
};

export type LocatorOptions = {
  targetId?: string;
  targetTemplate?: string;
  adapterId?: string;
  projectPath?: string;
  replacePath?: { from: string; to: string };
  bindings?: Binding[];
  promptTemplate?: string;
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
  bindings: [
    { modifiers: "alt", action: { kind: "open-editor" } },
    { icon: true, action: { kind: "show-tree" } },
    { icon: true, action: { kind: "show-parents" } },
    { icon: true, action: { kind: "copy-path" } },
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

// targetId and targetTemplate are two forms of one choice ("which target"),
// so a layer that sets either one overrides both from lower layers — otherwise
// a team-set template could never be overridden by a user picking a targetId.
const TARGET_KEYS = ["targetId", "targetTemplate"] as const;
const BINDING_KEYS = ["bindings", "mouseModifiers"] as const;

const DEFAULT_ICON_BINDINGS: Binding[] = [
  { icon: true, action: { kind: "show-tree" } },
  { icon: true, action: { kind: "show-parents" } },
  { icon: true, action: { kind: "copy-path" } },
];

/**
 * Converts a legacy layer to the bindings schema. This is intentionally pure
 * so it can be used for in-memory resolution as well as lazy persistence.
 */
export function normalizeLayer(options: LocatorOptions = {}): LocatorOptions {
  if (options.bindings !== undefined) {
    if (options.mouseModifiers === undefined) return options;
    const { mouseModifiers: _legacy, ...normalized } = options;
    return normalized;
  }
  if (options.mouseModifiers === undefined) return options;

  const { mouseModifiers, ...normalized } = options;
  return {
    ...normalized,
    bindings: [
      ...(mouseModifiers
        ? [
            {
              modifiers: mouseModifiers,
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

    if (TARGET_KEYS.some((key) => source[key] !== undefined)) {
      for (const key of TARGET_KEYS) {
        delete effective[key];
        delete provenance[key];
      }
    }

    if (BINDING_KEYS.some((key) => source[key] !== undefined)) {
      for (const key of BINDING_KEYS) {
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

export function resolveBindingTarget(
  action: Extract<BindingAction, { kind: "open-editor" }>,
  effective: LocatorOptions,
  targets: Targets
): ResolvedTarget {
  if (action.targetId === undefined && action.targetTemplate === undefined) {
    return resolveTarget(effective, targets);
  }
  return resolveTarget(
    {
      ...effective,
      targetId: action.targetId,
      targetTemplate: action.targetTemplate,
    },
    targets
  );
}

export function primaryEditorBinding(
  bindings: Binding[] | undefined
): Binding | undefined {
  return bindings?.find(
    (binding) => !!binding.modifiers && binding.action.kind === "open-editor"
  );
}

export function resolveFilePath(
  filePath: string,
  projectPath?: string
): string {
  if (!filePath.startsWith("[project]/") || !projectPath) return filePath;
  const relativePath = filePath.slice("[project]/".length);
  return projectPath.endsWith("/")
    ? projectPath + relativePath
    : projectPath + "/" + relativePath;
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
