import type { Targets } from "./index";

export type PromptApp = "cursor" | "windsurf";

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
  bindings: [
    {
      trigger: { kind: "modifier-click", modifiers: "alt" },
      action: { kind: "open-editor", targetId: "vscode" },
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
    if (actionOwnedOptions.mouseModifiers === undefined) {
      return actionOwnedOptions;
    }
    const normalized = { ...actionOwnedOptions };
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
                modifiers: mouseModifiers,
              },
              action: { kind: "open-editor", targetId: "vscode" } as const,
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
  targets: Targets
): ResolvedTarget {
  return resolveTarget(
    {
      targetId:
        action.targetId ??
        (action.targetTemplate === undefined && targets.vscode
          ? "vscode"
          : undefined),
      targetTemplate: action.targetTemplate,
    },
    targets
  );
}

export function primaryEditorBinding(
  bindings: Binding[] | undefined
): Binding | undefined {
  return (
    bindings?.find(
      (binding) =>
        binding.trigger.kind === "modifier-click" &&
        binding.action.kind === "open-editor"
    ) ?? bindings?.find((binding) => binding.action.kind === "open-editor")
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
  effective: { targetId?: string; targetTemplate?: string },
  targets: Targets
): ResolvedTarget {
  if (effective.targetTemplate) {
    return { kind: "template", url: effective.targetTemplate };
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
