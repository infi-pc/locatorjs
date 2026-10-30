export type AdapterId = "react" | "jsx" | "svelte" | "vue";

export type Modifier = "alt" | "ctrl" | "meta" | "shift";
export type PromptApp = "cursor" | "windsurf";

export type EditorDestination =
  | { readonly kind: "target"; readonly id: string }
  | { readonly kind: "template"; readonly template: string };

export type BindingTrigger =
  | {
      readonly kind: "modifier-click";
      readonly modifiers: readonly [Modifier, ...Modifier[]];
    }
  | { readonly kind: "hover-toolbar" };

export type BindingAction =
  | {
      readonly kind: "open-editor";
      readonly destination?: EditorDestination;
    }
  | { readonly kind: "copy-path" }
  | { readonly kind: "copy-prompt"; readonly template?: string }
  | {
      readonly kind: "open-prompt";
      readonly app: PromptApp;
      readonly template?: string;
    }
  | { readonly kind: "show-tree" }
  | { readonly kind: "show-parents" };

export type BindingInput = Readonly<{
  trigger: BindingTrigger;
  action: BindingAction;
}>;

export type TargetInput = string | Readonly<{ url: string; label: string }>;

export type LocatorLayerInput = Readonly<{
  adapter?: AdapterId;
  projectPath?: string;
  replacePath?: Readonly<{ from: string; to: string }>;
  editor?: EditorDestination;
  bindings?: readonly BindingInput[];
  hrefTarget?: "_self" | "_blank";
  tmuxSession?: string;
  disabled?: boolean;
  debugMode?: boolean;
  showIntro?: boolean;
}>;

export type LocatorConfigInput = LocatorLayerInput &
  Readonly<{
    targets?: Readonly<Record<string, TargetInput>>;
  }>;

export const CONFIG_FIELDS = [
  "adapter",
  "projectPath",
  "replacePath",
  "editor",
  "bindings",
  "hrefTarget",
  "tmuxSession",
  "disabled",
  "debugMode",
  "showIntro",
] as const;

export type ConfigField = (typeof CONFIG_FIELDS)[number];

export type LayerPatchInput = Readonly<{
  set?: Readonly<Partial<LocatorLayerInput>>;
  unset?: readonly ConfigField[];
}>;

export type ConfigErrorCode =
  | "expected-object"
  | "unknown-key"
  | "invalid-type"
  | "empty-value"
  | "invalid-enum"
  | "invalid-template"
  | "unsafe-template"
  | "unknown-template-variable"
  | "invalid-regexp"
  | "duplicate-modifier"
  | "empty-chord"
  | "duplicate-shortcut"
  | "duplicate-toolbar-action"
  | "too-many-bindings"
  | "unknown-target"
  | "conflicting-patch";

export type ConfigError = Readonly<{
  path: string;
  code: ConfigErrorCode;
  message: string;
}>;

export type ParseResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly ConfigError[] };

export type SetupResult =
  | Readonly<{ ok: true }>
  | Readonly<{ ok: false; errors: readonly ConfigError[] }>;

declare const targetIdBrand: unique symbol;
export type TargetId = string & { readonly [targetIdBrand]: true };

declare const urlTemplateBrand: unique symbol;
export type UrlTemplate = string & { readonly [urlTemplateBrand]: true };

declare const promptTemplateBrand: unique symbol;
export type PromptTemplate = string & {
  readonly [promptTemplateBrand]: true;
};

declare const modifierChordBrand: unique symbol;
export type ModifierChord = number & { readonly [modifierChordBrand]: true };

declare const editorChoiceBrand: unique symbol;
export type EditorChoice =
  | Readonly<{
      kind: "target";
      id: TargetId;
      [editorChoiceBrand]: true;
    }>
  | Readonly<{
      kind: "template";
      template: UrlTemplate;
      [editorChoiceBrand]: true;
    }>;

type InheritedDestination = Readonly<{ kind: "inherit" }>;

export type ConfiguredAction =
  | Readonly<{
      kind: "open-editor";
      destination: EditorChoice | InheritedDestination;
    }>
  | Readonly<{ kind: "copy-path" }>
  | Readonly<{
      kind: "copy-prompt";
      template: PromptTemplate | null;
    }>
  | Readonly<{
      kind: "open-prompt";
      app: PromptApp;
      template: PromptTemplate | null;
    }>
  | Readonly<{ kind: "show-tree" }>
  | Readonly<{ kind: "show-parents" }>;

declare const bindingsBrand: unique symbol;
export type Bindings = Readonly<{
  shortcuts: Readonly<Record<number, ConfiguredAction>>;
  toolbar: readonly ConfiguredAction[];
  [bindingsBrand]: true;
}>;

type PathRewriteImplementation = Readonly<{
  from: string;
  to: string;
}>;

declare const pathRewriteBrand: unique symbol;
export type PathRewrite = PathRewriteImplementation & {
  readonly [pathRewriteBrand]: true;
};

export type TargetDefinition = Readonly<{
  id: TargetId;
  url: UrlTemplate;
  label: string;
}>;

export type TargetView = Readonly<{ url: string; label: string }>;
export type TargetViewMap = Readonly<Record<string, TargetView>>;

export type ConfiguredBinding =
  | Readonly<{
      trigger: Readonly<{
        kind: "modifier-click";
        chord: ModifierChord;
      }>;
      action: ConfiguredAction;
    }>
  | Readonly<{
      trigger: Readonly<{ kind: "hover-toolbar" }>;
      action: ConfiguredAction;
    }>;

declare const targetRegistryBrand: unique symbol;
export type TargetRegistry = Readonly<{
  entries: readonly TargetDefinition[];
  byId: Readonly<Record<string, TargetDefinition>>;
  [targetRegistryBrand]: true;
}>;

declare const locatorLayerBrand: unique symbol;
export type LocatorLayer = Readonly<{
  adapter?: AdapterId;
  projectPath?: string;
  replacePath?: PathRewrite;
  editor?: EditorChoice;
  bindings?: Bindings;
  hrefTarget?: "_self" | "_blank";
  tmuxSession?: string;
  disabled?: boolean;
  debugMode?: boolean;
  showIntro?: boolean;
  [locatorLayerBrand]: true;
}>;

export type LocatorLayerId =
  | "default"
  | "team"
  | "user-extension"
  | "user-origin";

export type ResolvedField<T> = Readonly<{
  value: T;
  source: LocatorLayerId;
}>;

export type EffectiveEditor =
  | Readonly<{
      kind: "selected";
      destination: EditorChoice;
      template: UrlTemplate;
      label: string;
    }>
  | Readonly<{
      kind: "needs-selection";
      reason: "default-only" | "unknown-target";
      suggestion?: EditorChoice;
    }>;

export type SelectedEditor = Extract<EffectiveEditor, { kind: "selected" }>;

export type EffectiveEditorView =
  | Readonly<{
      kind: "selected";
      destination: EditorDestination;
      template: string;
      label: string;
    }>
  | Readonly<{
      kind: "needs-selection";
      reason: "default-only" | "unknown-target";
      suggestion?: EditorDestination;
    }>;

export type EffectiveOptionsView = Readonly<{
  adapter: AdapterId | null;
  projectPath: string | null;
  replacePath: Readonly<{ from: string; to: string }> | null;
  editor: EffectiveEditorView;
  bindings: readonly BindingInput[];
  hrefTarget: "_self" | "_blank";
  tmuxSession: string | null;
  disabled: boolean;
  debugMode: boolean;
  showIntro: boolean;
}>;

export type EffectiveOptions = Readonly<{
  adapter:
    | Readonly<{ kind: "auto" }>
    | Readonly<{ kind: "fixed"; id: AdapterId }>;
  projectPath: string | null;
  replacePath: PathRewrite | null;
  editor: EffectiveEditor;
  bindings: Bindings;
  hrefTarget: "_self" | "_blank";
  tmuxSession: string | null;
  disabled: boolean;
  debugMode: boolean;
  showIntro: boolean;
}>;

export type ResolvedConfig = Readonly<{
  fields: Readonly<{
    adapter: ResolvedField<EffectiveOptions["adapter"]>;
    projectPath: ResolvedField<string | null>;
    replacePath: ResolvedField<PathRewrite | null>;
    editor: ResolvedField<EffectiveEditor>;
    bindings: ResolvedField<Bindings>;
    hrefTarget: ResolvedField<"_self" | "_blank">;
    tmuxSession: ResolvedField<string | null>;
    disabled: ResolvedField<boolean>;
    debugMode: ResolvedField<boolean>;
    showIntro: ResolvedField<boolean>;
  }>;
  targets: TargetRegistry;
}>;

export type SerializedLayerV3 = LocatorLayerInput;

export type ConfigEnvelopeV3 = Readonly<{
  version: 3;
  revision: number;
  layer: SerializedLayerV3;
}>;

export type ConfigReadResult =
  | Readonly<{ kind: "empty" }>
  | Readonly<{ kind: "ready"; revision: number; layer: LocatorLayer }>
  | Readonly<{ kind: "reset-required" }>
  | Readonly<{ kind: "future-version"; version: number }>
  | Readonly<{ kind: "corrupt"; errors: readonly ConfigError[] }>;

export type CompiledSetup = Readonly<{
  layer: LocatorLayer;
  targets: TargetRegistry;
}>;

declare const layerPatchBrand: unique symbol;
export type LayerPatch = Readonly<{
  set: LocatorLayer;
  unset: readonly ConfigField[];
  [layerPatchBrand]: true;
}>;

const MAX_BINDINGS_PER_GROUP = 6;
const MODIFIER_ORDER = ["alt", "ctrl", "shift", "meta"] as const;
const MODIFIER_BITS: Readonly<Record<Modifier, number>> = Object.freeze({
  alt: 1,
  ctrl: 2,
  shift: 4,
  meta: 8,
});
const ADAPTERS = new Set<AdapterId>(["react", "jsx", "svelte", "vue"]);
const ACTIVE_CONTENT_SCHEMES = new Set([
  "blob",
  "data",
  "javascript",
  "vbscript",
]);
const LINK_TEMPLATE_VARIABLES = new Set([
  "projectPath",
  "filePath",
  "line",
  "column",
  "linePlusOne",
  "columnPlusOne",
  "lineMinusOne",
  "columnMinusOne",
  "tmuxSession",
]);
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
const PROMPT_VARIABLE_SET = new Set<string>(PROMPT_TEMPLATE_VARIABLES);
const FIELD_SET = new Set<string>(CONFIG_FIELDS);
const SETUP_FIELD_SET = new Set<string>([...CONFIG_FIELDS, "targets"]);
const rewriteExpressions = new WeakMap<PathRewrite, RegExp>();

export const DEFAULT_PROMPT_TEMPLATE = `Please help me update this UI element.

File: \${filePath}:\${line}:\${column}
Component: \${componentName}
Component tree: \${componentTree}
Element: \${elementLabel}

\${htmlSnippet}`;

function plainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function path(parent: string, key: string | number): string {
  const escaped = String(key).replaceAll("~", "~0").replaceAll("/", "~1");
  return `${parent}/${escaped}`;
}

function issue(
  errors: ConfigError[],
  issuePath: string,
  code: ConfigErrorCode,
  message: string
) {
  errors.push(Object.freeze({ path: issuePath || "/", code, message }));
}

function sortedErrors(errors: ConfigError[]): readonly ConfigError[] {
  return Object.freeze(
    [...errors].sort(
      (left, right) =>
        left.path.localeCompare(right.path) ||
        left.code.localeCompare(right.code)
    )
  );
}

function result<T>(
  value: T | undefined,
  errors: ConfigError[]
): ParseResult<T> {
  return errors.length > 0 || value === undefined
    ? { ok: false, errors: sortedErrors(errors) }
    : { ok: true, value };
}

function exactKeys(
  record: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  parent: string,
  errors: ConfigError[]
) {
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) {
      issue(
        errors,
        path(parent, key),
        "unknown-key",
        `Unknown field "${key}".`
      );
    }
  }
}

function nonemptyString(
  value: unknown,
  valuePath: string,
  errors: ConfigError[]
): string | undefined {
  if (typeof value !== "string") {
    issue(errors, valuePath, "invalid-type", "Expected a string.");
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    issue(errors, valuePath, "empty-value", "Expected a non-empty string.");
    return undefined;
  }
  return trimmed;
}

function parseTemplateVariables(
  template: string,
  allowed: ReadonlySet<string>,
  valuePath: string,
  errors: ConfigError[]
) {
  const expression = /\$\{([^}]+)\}/g;
  for (const match of template.matchAll(expression)) {
    const variable = match[1];
    if (variable && !allowed.has(variable)) {
      issue(
        errors,
        valuePath,
        "unknown-template-variable",
        `Unknown template variable "${variable}".`
      );
    }
  }
}

function parseUrlTemplate(
  value: unknown,
  valuePath: string,
  errors: ConfigError[]
): UrlTemplate | undefined {
  const template = nonemptyString(value, valuePath, errors);
  if (!template) return undefined;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(template)?.[1];
  if (!scheme) {
    issue(
      errors,
      valuePath,
      "invalid-template",
      "Expected a URL template with a static scheme."
    );
    return undefined;
  }
  if (ACTIVE_CONTENT_SCHEMES.has(scheme.toLowerCase())) {
    issue(
      errors,
      valuePath,
      "unsafe-template",
      "Active-content URL schemes are not allowed."
    );
    return undefined;
  }
  parseTemplateVariables(template, LINK_TEMPLATE_VARIABLES, valuePath, errors);
  return template as UrlTemplate;
}

function parsePromptTemplate(
  value: unknown,
  valuePath: string,
  errors: ConfigError[]
): PromptTemplate | undefined {
  const template = nonemptyString(value, valuePath, errors);
  if (!template) return undefined;
  parseTemplateVariables(template, PROMPT_VARIABLE_SET, valuePath, errors);
  return template as PromptTemplate;
}

function targetId(value: unknown, valuePath: string, errors: ConfigError[]) {
  const id = nonemptyString(value, valuePath, errors);
  return id as TargetId | undefined;
}

function parseEditorChoice(
  value: unknown,
  valuePath: string,
  errors: ConfigError[]
): EditorChoice | undefined {
  if (!plainObject(value)) {
    issue(
      errors,
      valuePath,
      "expected-object",
      "Expected an editor destination."
    );
    return undefined;
  }
  if (value.kind === "target") {
    exactKeys(value, new Set(["kind", "id"]), valuePath, errors);
    const id = targetId(value.id, path(valuePath, "id"), errors);
    return id
      ? (Object.freeze({ kind: "target", id }) as EditorChoice)
      : undefined;
  }
  if (value.kind === "template") {
    exactKeys(value, new Set(["kind", "template"]), valuePath, errors);
    const template = parseUrlTemplate(
      value.template,
      path(valuePath, "template"),
      errors
    );
    return template
      ? (Object.freeze({ kind: "template", template }) as EditorChoice)
      : undefined;
  }
  issue(
    errors,
    path(valuePath, "kind"),
    "invalid-enum",
    'Expected editor kind "target" or "template".'
  );
  return undefined;
}

function parseConfiguredAction(
  value: unknown,
  valuePath: string,
  errors: ConfigError[]
): ConfiguredAction | undefined {
  if (!plainObject(value)) {
    issue(errors, valuePath, "expected-object", "Expected a binding action.");
    return undefined;
  }
  switch (value.kind) {
    case "open-editor": {
      exactKeys(value, new Set(["kind", "destination"]), valuePath, errors);
      const destination =
        value.destination === undefined
          ? Object.freeze({ kind: "inherit" as const })
          : parseEditorChoice(
              value.destination,
              path(valuePath, "destination"),
              errors
            );
      return destination
        ? Object.freeze({ kind: "open-editor" as const, destination })
        : undefined;
    }
    case "copy-path":
    case "show-tree":
    case "show-parents":
      exactKeys(value, new Set(["kind"]), valuePath, errors);
      return Object.freeze({ kind: value.kind });
    case "copy-prompt": {
      exactKeys(value, new Set(["kind", "template"]), valuePath, errors);
      const template =
        value.template === undefined
          ? null
          : parsePromptTemplate(
              value.template,
              path(valuePath, "template"),
              errors
            );
      return template !== undefined
        ? Object.freeze({ kind: "copy-prompt" as const, template })
        : undefined;
    }
    case "open-prompt": {
      exactKeys(value, new Set(["kind", "app", "template"]), valuePath, errors);
      const app =
        value.app === "cursor" || value.app === "windsurf"
          ? value.app
          : undefined;
      if (!app) {
        issue(
          errors,
          path(valuePath, "app"),
          "invalid-enum",
          'Expected prompt app "cursor" or "windsurf".'
        );
      }
      const template =
        value.template === undefined
          ? null
          : parsePromptTemplate(
              value.template,
              path(valuePath, "template"),
              errors
            );
      return app && template !== undefined
        ? Object.freeze({ kind: "open-prompt" as const, app, template })
        : undefined;
    }
    default:
      issue(
        errors,
        path(valuePath, "kind"),
        "invalid-enum",
        "Unknown binding action."
      );
      return undefined;
  }
}

export function parseAction(value: unknown): ParseResult<ConfiguredAction> {
  const errors: ConfigError[] = [];
  return result(parseConfiguredAction(value, "", errors), errors);
}

function parseModifierChord(
  value: unknown,
  valuePath: string,
  errors: ConfigError[]
): ModifierChord | undefined {
  if (!Array.isArray(value)) {
    issue(errors, valuePath, "invalid-type", "Expected a modifier array.");
    return undefined;
  }
  if (value.length === 0) {
    issue(errors, valuePath, "empty-chord", "A shortcut needs a modifier.");
    return undefined;
  }
  let mask = 0;
  const seen = new Set<Modifier>();
  for (const [index, modifier] of value.entries()) {
    if (
      modifier !== "alt" &&
      modifier !== "ctrl" &&
      modifier !== "shift" &&
      modifier !== "meta"
    ) {
      issue(
        errors,
        path(valuePath, index),
        "invalid-enum",
        "Unknown modifier."
      );
      continue;
    }
    if (seen.has(modifier)) {
      issue(
        errors,
        path(valuePath, index),
        "duplicate-modifier",
        `Modifier "${modifier}" is repeated.`
      );
      continue;
    }
    const knownModifier = modifier as Modifier;
    seen.add(knownModifier);
    mask |= MODIFIER_BITS[knownModifier];
  }
  return mask > 0 ? (mask as ModifierChord) : undefined;
}

function parseBindings(
  value: unknown,
  valuePath: string,
  errors: ConfigError[]
): Bindings | undefined {
  if (!Array.isArray(value)) {
    issue(errors, valuePath, "invalid-type", "Expected a binding array.");
    return undefined;
  }
  const shortcuts: Record<number, ConfiguredAction> = Object.create(
    null
  ) as Record<number, ConfiguredAction>;
  const toolbar: ConfiguredAction[] = [];
  const toolbarKeys = new Set<string>();
  let shortcutCount = 0;
  for (const [index, candidate] of value.entries()) {
    const bindingPath = path(valuePath, index);
    if (!plainObject(candidate)) {
      issue(errors, bindingPath, "expected-object", "Expected a binding.");
      continue;
    }
    exactKeys(candidate, new Set(["trigger", "action"]), bindingPath, errors);
    const action = parseConfiguredAction(
      candidate.action,
      path(bindingPath, "action"),
      errors
    );
    const trigger = candidate.trigger;
    if (!plainObject(trigger)) {
      issue(
        errors,
        path(bindingPath, "trigger"),
        "expected-object",
        "Expected a binding trigger."
      );
      continue;
    }
    if (trigger.kind === "modifier-click") {
      exactKeys(
        trigger,
        new Set(["kind", "modifiers"]),
        path(bindingPath, "trigger"),
        errors
      );
      const chord = parseModifierChord(
        trigger.modifiers,
        path(path(bindingPath, "trigger"), "modifiers"),
        errors
      );
      if (chord !== undefined && action) {
        if (shortcuts[chord]) {
          issue(
            errors,
            path(bindingPath, "trigger"),
            "duplicate-shortcut",
            "Another binding already owns this shortcut."
          );
        } else {
          shortcuts[chord] = action;
          shortcutCount += 1;
        }
      }
      continue;
    }
    if (trigger.kind === "hover-toolbar") {
      exactKeys(
        trigger,
        new Set(["kind"]),
        path(bindingPath, "trigger"),
        errors
      );
      if (action) {
        const actionKey = JSON.stringify(encodeAction(action));
        if (toolbarKeys.has(actionKey)) {
          issue(
            errors,
            path(bindingPath, "action"),
            "duplicate-toolbar-action",
            "This toolbar action is already present."
          );
        } else {
          toolbarKeys.add(actionKey);
          toolbar.push(action);
        }
      }
      continue;
    }
    issue(
      errors,
      path(path(bindingPath, "trigger"), "kind"),
      "invalid-enum",
      "Unknown binding trigger."
    );
  }
  if (shortcutCount > MAX_BINDINGS_PER_GROUP) {
    issue(
      errors,
      valuePath,
      "too-many-bindings",
      `At most ${MAX_BINDINGS_PER_GROUP} shortcuts are supported.`
    );
  }
  if (toolbar.length > MAX_BINDINGS_PER_GROUP) {
    issue(
      errors,
      valuePath,
      "too-many-bindings",
      `At most ${MAX_BINDINGS_PER_GROUP} toolbar actions are supported.`
    );
  }
  return Object.freeze({
    shortcuts: Object.freeze(shortcuts),
    toolbar: Object.freeze(toolbar),
  }) as Bindings;
}

function parsePathRewrite(
  value: unknown,
  valuePath: string,
  errors: ConfigError[]
): PathRewrite | undefined {
  if (!plainObject(value)) {
    issue(errors, valuePath, "expected-object", "Expected a path rewrite.");
    return undefined;
  }
  exactKeys(value, new Set(["from", "to"]), valuePath, errors);
  if (typeof value.from !== "string") {
    issue(
      errors,
      path(valuePath, "from"),
      "invalid-type",
      "Expected a string."
    );
  }
  if (typeof value.to !== "string") {
    issue(errors, path(valuePath, "to"), "invalid-type", "Expected a string.");
  }
  if (typeof value.from !== "string" || typeof value.to !== "string") {
    return undefined;
  }
  if (!value.from && !value.to) {
    issue(errors, valuePath, "empty-value", "A path rewrite cannot be empty.");
    return undefined;
  }
  try {
    const rewrite = Object.freeze({
      from: value.from,
      to: value.to,
    }) as PathRewrite;
    rewriteExpressions.set(rewrite, new RegExp(value.from));
    return rewrite;
  } catch {
    issue(
      errors,
      path(valuePath, "from"),
      "invalid-regexp",
      "Expected a valid regular expression."
    );
    return undefined;
  }
}

function parseLayerRecord(
  record: Record<string, unknown>,
  parent: string,
  errors: ConfigError[]
): LocatorLayer {
  const layer: Record<string, unknown> = {};
  if (record.adapter !== undefined) {
    if (
      typeof record.adapter === "string" &&
      ADAPTERS.has(record.adapter as AdapterId)
    ) {
      layer.adapter = record.adapter as AdapterId;
    } else {
      issue(
        errors,
        path(parent, "adapter"),
        "invalid-enum",
        "Unknown adapter."
      );
    }
  }
  if (record.projectPath !== undefined) {
    const projectPath = nonemptyString(
      record.projectPath,
      path(parent, "projectPath"),
      errors
    );
    if (projectPath) {
      const isRoot = /^[\\/]+$/.test(projectPath);
      const isWindowsDriveRoot = /^[a-z]:[\\/]$/i.test(projectPath);
      layer.projectPath =
        isRoot || isWindowsDriveRoot
          ? projectPath
          : projectPath.replace(/[\\/]+$/, "");
    }
  }
  if (record.replacePath !== undefined) {
    const rewrite = parsePathRewrite(
      record.replacePath,
      path(parent, "replacePath"),
      errors
    );
    if (rewrite) layer.replacePath = rewrite;
  }
  if (record.editor !== undefined) {
    const editor = parseEditorChoice(
      record.editor,
      path(parent, "editor"),
      errors
    );
    if (editor) layer.editor = editor;
  }
  if (record.bindings !== undefined) {
    const bindings = parseBindings(
      record.bindings,
      path(parent, "bindings"),
      errors
    );
    if (bindings) layer.bindings = bindings;
  }
  if (record.hrefTarget !== undefined) {
    if (record.hrefTarget === "_self" || record.hrefTarget === "_blank") {
      layer.hrefTarget = record.hrefTarget;
    } else {
      issue(
        errors,
        path(parent, "hrefTarget"),
        "invalid-enum",
        'Expected "_self" or "_blank".'
      );
    }
  }
  if (record.tmuxSession !== undefined) {
    const session = nonemptyString(
      record.tmuxSession,
      path(parent, "tmuxSession"),
      errors
    );
    if (session) layer.tmuxSession = session;
  }
  for (const key of ["disabled", "debugMode", "showIntro"] as const) {
    if (record[key] === undefined) continue;
    if (typeof record[key] === "boolean") {
      layer[key] = record[key];
    } else {
      issue(errors, path(parent, key), "invalid-type", "Expected a boolean.");
    }
  }
  return Object.freeze(layer) as LocatorLayer;
}

export function parseLayer(value: unknown): ParseResult<LocatorLayer> {
  const errors: ConfigError[] = [];
  if (!plainObject(value)) {
    issue(errors, "/", "expected-object", "Expected a configuration object.");
    return { ok: false, errors: sortedErrors(errors) };
  }
  exactKeys(value, FIELD_SET, "", errors);
  return result(parseLayerRecord(value, "", errors), errors);
}

function parseTargetRegistry(
  value: unknown,
  valuePath: string,
  errors: ConfigError[]
): TargetRegistry | undefined {
  if (!plainObject(value)) {
    issue(errors, valuePath, "expected-object", "Expected a target map.");
    return undefined;
  }
  const entries: TargetDefinition[] = [];
  const byId: Record<string, TargetDefinition> = Object.create(null) as Record<
    string,
    TargetDefinition
  >;
  for (const [rawId, rawTarget] of Object.entries(value)) {
    const idPath = path(valuePath, rawId);
    const id = targetId(rawId, idPath, errors);
    let url: UrlTemplate | undefined;
    let label: string | undefined;
    if (typeof rawTarget === "string") {
      url = parseUrlTemplate(rawTarget, idPath, errors);
      label = id;
    } else if (plainObject(rawTarget)) {
      exactKeys(rawTarget, new Set(["url", "label"]), idPath, errors);
      url = parseUrlTemplate(rawTarget.url, path(idPath, "url"), errors);
      label = nonemptyString(rawTarget.label, path(idPath, "label"), errors);
    } else {
      issue(errors, idPath, "invalid-type", "Expected a target URL or object.");
    }
    if (id && url && label) {
      const target = Object.freeze({ id, url, label });
      entries.push(target);
      byId[id] = target;
    }
  }
  if (entries.length === 0) {
    issue(errors, valuePath, "empty-value", "At least one target is required.");
    return undefined;
  }
  return Object.freeze({
    entries: Object.freeze(entries),
    byId: Object.freeze(byId),
  }) as TargetRegistry;
}

export function compileSetup(value: unknown = {}): ParseResult<CompiledSetup> {
  const errors: ConfigError[] = [];
  if (!plainObject(value)) {
    issue(errors, "/", "expected-object", "Expected a setup object.");
    return { ok: false, errors: sortedErrors(errors) };
  }
  exactKeys(value, SETUP_FIELD_SET, "", errors);
  const layerRecord: Record<string, unknown> = {};
  for (const field of CONFIG_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(value, field)) {
      layerRecord[field] = value[field];
    }
  }
  let layer = parseLayerRecord(layerRecord, "", errors);
  const targets =
    value.targets === undefined
      ? BUILT_IN_TARGETS
      : parseTargetRegistry(value.targets, "/targets", errors);
  if (targets && value.targets !== undefined && layer.editor === undefined) {
    const first = targets.entries[0];
    if (first) {
      layer = Object.freeze({
        ...layer,
        editor: Object.freeze({ kind: "target", id: first.id }) as EditorChoice,
      }) as LocatorLayer;
    }
  }
  if (
    targets &&
    layer.editor?.kind === "target" &&
    !targets.byId[layer.editor.id]
  ) {
    issue(
      errors,
      "/editor/id",
      "unknown-target",
      "The selected editor is not present in the active target map."
    );
  }
  return result(
    targets ? Object.freeze({ layer, targets }) : undefined,
    errors
  );
}

export function parseLayerPatch(value: unknown): ParseResult<LayerPatch> {
  const errors: ConfigError[] = [];
  if (!plainObject(value)) {
    issue(errors, "/", "expected-object", "Expected a layer patch.");
    return { ok: false, errors: sortedErrors(errors) };
  }
  exactKeys(value, new Set(["set", "unset"]), "", errors);
  let set: LocatorLayer | undefined;
  if (value.set === undefined) {
    set = parseLayerRecord({}, "/set", errors);
  } else if (!plainObject(value.set)) {
    issue(
      errors,
      "/set",
      "expected-object",
      "Expected a configuration object."
    );
  } else {
    exactKeys(value.set, FIELD_SET, "/set", errors);
    set = parseLayerRecord(value.set, "/set", errors);
  }
  const unset: ConfigField[] = [];
  const seen = new Set<ConfigField>();
  if (value.unset !== undefined && !Array.isArray(value.unset)) {
    issue(errors, "/unset", "invalid-type", "Expected a field array.");
  } else if (Array.isArray(value.unset)) {
    for (const [index, field] of value.unset.entries()) {
      if (typeof field !== "string" || !FIELD_SET.has(field)) {
        issue(
          errors,
          path("/unset", index),
          "invalid-enum",
          "Unknown configuration field."
        );
        continue;
      }
      const configField = field as ConfigField;
      if (!seen.has(configField)) {
        seen.add(configField);
        unset.push(configField);
      }
    }
  }
  if (plainObject(value.set)) {
    for (const field of unset) {
      if (Object.prototype.hasOwnProperty.call(value.set, field)) {
        issue(
          errors,
          path("/set", field),
          "conflicting-patch",
          "A patch cannot set and unset the same field."
        );
      }
    }
  }
  return result(
    set
      ? (Object.freeze({
          set,
          unset: Object.freeze(unset),
        }) as LayerPatch)
      : undefined,
    errors
  );
}

export function applyLayerPatch(
  current: LocatorLayer,
  patchValue: LayerPatch
): Readonly<{ layer: LocatorLayer; changed: boolean }> {
  const next = { ...current, ...patchValue.set } as Record<string, unknown>;
  for (const field of patchValue.unset) delete next[field];
  const layer = Object.freeze(next) as LocatorLayer;
  return Object.freeze({
    layer,
    changed:
      JSON.stringify(encodeLayer(current)) !==
      JSON.stringify(encodeLayer(layer)),
  });
}

export function encodeEditorDestination(
  choice: EditorChoice
): EditorDestination {
  return choice.kind === "target"
    ? Object.freeze({ kind: "target", id: choice.id })
    : Object.freeze({ kind: "template", template: choice.template });
}

export function encodeAction(action: ConfiguredAction): BindingAction {
  switch (action.kind) {
    case "open-editor":
      return Object.freeze({
        kind: "open-editor",
        ...(action.destination.kind === "inherit"
          ? {}
          : { destination: encodeEditorDestination(action.destination) }),
      });
    case "copy-prompt":
      return Object.freeze({
        kind: "copy-prompt",
        ...(action.template === null ? {} : { template: action.template }),
      });
    case "open-prompt":
      return Object.freeze({
        kind: "open-prompt",
        app: action.app,
        ...(action.template === null ? {} : { template: action.template }),
      });
    default:
      return Object.freeze({ kind: action.kind });
  }
}

export function modifiersForChord(
  chord: ModifierChord
): readonly [Modifier, ...Modifier[]] {
  const modifiers = MODIFIER_ORDER.filter(
    (modifier) => (chord & MODIFIER_BITS[modifier]) !== 0
  );
  return Object.freeze(modifiers) as readonly [Modifier, ...Modifier[]];
}

export function encodeBindings(bindings: Bindings): readonly BindingInput[] {
  const shortcutBindings = Object.entries(bindings.shortcuts)
    .map(
      ([rawChord, action]) =>
        [Number(rawChord) as ModifierChord, action] as const
    )
    .sort(([left], [right]) => left - right)
    .map(([chord, action]) =>
      Object.freeze({
        trigger: Object.freeze({
          kind: "modifier-click" as const,
          modifiers: modifiersForChord(chord),
        }),
        action: encodeAction(action),
      })
    );
  const toolbarBindings = bindings.toolbar.map((action) =>
    Object.freeze({
      trigger: Object.freeze({ kind: "hover-toolbar" as const }),
      action: encodeAction(action),
    })
  );
  return Object.freeze([...shortcutBindings, ...toolbarBindings]);
}

export function configuredBindings(
  bindings: Bindings
): readonly ConfiguredBinding[] {
  const shortcuts = Object.entries(bindings.shortcuts)
    .map(
      ([rawChord, action]) =>
        [Number(rawChord) as ModifierChord, action] as const
    )
    .sort(([left], [right]) => left - right)
    .map(
      ([chord, action]) =>
        Object.freeze({
          trigger: Object.freeze({
            kind: "modifier-click" as const,
            chord,
          }),
          action,
        }) as ConfiguredBinding
    );
  const toolbar = bindings.toolbar.map(
    (action) =>
      Object.freeze({
        trigger: Object.freeze({ kind: "hover-toolbar" as const }),
        action,
      }) as ConfiguredBinding
  );
  return Object.freeze([...shortcuts, ...toolbar]);
}

export function primaryEditorShortcut(
  bindings: Bindings
):
  | Extract<ConfiguredBinding, { trigger: { kind: "modifier-click" } }>
  | undefined {
  return configuredBindings(bindings).find(
    (
      binding
    ): binding is Extract<
      ConfiguredBinding,
      { trigger: { kind: "modifier-click" } }
    > =>
      binding.trigger.kind === "modifier-click" &&
      binding.action.kind === "open-editor"
  );
}

export function primaryEditorBinding(
  bindings: Bindings
): ConfiguredBinding | undefined {
  return (
    primaryEditorShortcut(bindings) ??
    configuredBindings(bindings).find(
      (binding) => binding.action.kind === "open-editor"
    )
  );
}

export function encodeLayer(layer: LocatorLayer): SerializedLayerV3 {
  const encoded: Record<string, unknown> = {};
  for (const field of CONFIG_FIELDS) {
    const value = layer[field];
    if (value === undefined) continue;
    switch (field) {
      case "replacePath": {
        const rewrite = value as PathRewrite;
        encoded[field] = Object.freeze({ from: rewrite.from, to: rewrite.to });
        break;
      }
      case "editor":
        encoded[field] = encodeEditorDestination(value as EditorChoice);
        break;
      case "bindings":
        encoded[field] = encodeBindings(value as Bindings);
        break;
      default:
        encoded[field] = value;
    }
  }
  return Object.freeze(encoded) as SerializedLayerV3;
}

export function encodeEnvelope(
  layer: LocatorLayer,
  revision: number
): ConfigEnvelopeV3 {
  if (!Number.isSafeInteger(revision) || revision < 0) {
    throw new Error(
      "Configuration revision must be a nonnegative safe integer."
    );
  }
  return Object.freeze({ version: 3, revision, layer: encodeLayer(layer) });
}

export function decodeEnvelope(value: unknown): ConfigReadResult {
  if (value === undefined || value === null)
    return Object.freeze({ kind: "empty" });
  if (!plainObject(value) || typeof value.version !== "number") {
    return Object.freeze({ kind: "reset-required" });
  }
  if (value.version > 3) {
    return Object.freeze({ kind: "future-version", version: value.version });
  }
  if (value.version !== 3) return Object.freeze({ kind: "reset-required" });
  if (!Number.isSafeInteger(value.revision) || (value.revision as number) < 0) {
    return Object.freeze({
      kind: "corrupt",
      errors: Object.freeze([
        Object.freeze({
          path: "/revision",
          code: "invalid-type" as const,
          message: "Expected a nonnegative safe integer.",
        }),
      ]),
    });
  }
  const parsed = parseLayer(value.layer);
  return parsed.ok
    ? Object.freeze({
        kind: "ready",
        revision: value.revision as number,
        layer: parsed.value,
      })
    : Object.freeze({ kind: "corrupt", errors: parsed.errors });
}

function layerValue<K extends ConfigField>(
  layers: Partial<Record<LocatorLayerId, LocatorLayer>>,
  field: K,
  fallback: LocatorLayer[K]
): ResolvedField<NonNullable<LocatorLayer[K]>> {
  let value = fallback;
  let source: LocatorLayerId = "default";
  for (const layerId of ["team", "user-extension", "user-origin"] as const) {
    const candidate = layers[layerId]?.[field];
    if (candidate !== undefined) {
      value = candidate;
      source = layerId;
    }
  }
  return Object.freeze({
    value: value as NonNullable<LocatorLayer[K]>,
    source,
  });
}

function resolveEditor(
  choice: EditorChoice,
  source: LocatorLayerId,
  targets: TargetRegistry
): EffectiveEditor {
  if (source === "default") {
    const suggested =
      choice.kind === "target" && targets.byId[choice.id] ? choice : undefined;
    return Object.freeze({
      kind: "needs-selection",
      reason: "default-only",
      ...(suggested ? { suggestion: suggested } : {}),
    });
  }
  if (choice.kind === "template") {
    return Object.freeze({
      kind: "selected",
      destination: choice,
      template: choice.template,
      label: "Custom",
    });
  }
  const target = targets.byId[choice.id];
  return target
    ? Object.freeze({
        kind: "selected",
        destination: choice,
        template: target.url,
        label: target.label,
      })
    : Object.freeze({
        kind: "needs-selection",
        reason: "unknown-target",
        suggestion: choice,
      });
}

export function resolveConfig(
  layers: Partial<Record<LocatorLayerId, LocatorLayer>>,
  targets: TargetRegistry
): ResolvedConfig {
  const adapterRaw = layerValue(layers, "adapter", undefined);
  const projectPath = layerValue(layers, "projectPath", undefined);
  const replacePath = layerValue(layers, "replacePath", undefined);
  const editorChoice = layerValue(layers, "editor", DEFAULT_EDITOR);
  const bindings = layerValue(layers, "bindings", DEFAULT_BINDINGS);
  const hrefTarget = layerValue(layers, "hrefTarget", "_self");
  const tmuxSession = layerValue(layers, "tmuxSession", undefined);
  const disabled = layerValue(layers, "disabled", false);
  const debugMode = layerValue(layers, "debugMode", false);
  const showIntro = layerValue(layers, "showIntro", true);

  return Object.freeze({
    targets,
    fields: Object.freeze({
      adapter: Object.freeze({
        value:
          adapterRaw.value === undefined
            ? Object.freeze({ kind: "auto" as const })
            : Object.freeze({ kind: "fixed" as const, id: adapterRaw.value }),
        source: adapterRaw.source,
      }),
      projectPath: Object.freeze({
        value: projectPath.value ?? null,
        source: projectPath.source,
      }),
      replacePath: Object.freeze({
        value: replacePath.value ?? null,
        source: replacePath.source,
      }),
      editor: Object.freeze({
        value: resolveEditor(editorChoice.value, editorChoice.source, targets),
        source: editorChoice.source,
      }),
      bindings,
      hrefTarget,
      tmuxSession: Object.freeze({
        value: tmuxSession.value ?? null,
        source: tmuxSession.source,
      }),
      disabled,
      debugMode,
      showIntro,
    }),
  });
}

export function effectiveOptions(config: ResolvedConfig): EffectiveOptions {
  return Object.freeze({
    adapter: config.fields.adapter.value,
    projectPath: config.fields.projectPath.value,
    replacePath: config.fields.replacePath.value,
    editor: config.fields.editor.value,
    bindings: config.fields.bindings.value,
    hrefTarget: config.fields.hrefTarget.value,
    tmuxSession: config.fields.tmuxSession.value,
    disabled: config.fields.disabled.value,
    debugMode: config.fields.debugMode.value,
    showIntro: config.fields.showIntro.value,
  });
}

export function effectiveOptionsView(
  options: EffectiveOptions
): EffectiveOptionsView {
  const editor: EffectiveEditorView =
    options.editor.kind === "selected"
      ? Object.freeze({
          kind: "selected",
          destination: encodeEditorDestination(options.editor.destination),
          template: options.editor.template,
          label: options.editor.label,
        })
      : Object.freeze({
          kind: "needs-selection",
          reason: options.editor.reason,
          ...(options.editor.suggestion
            ? {
                suggestion: encodeEditorDestination(options.editor.suggestion),
              }
            : {}),
        });
  return Object.freeze({
    adapter: options.adapter.kind === "fixed" ? options.adapter.id : null,
    projectPath: options.projectPath,
    replacePath: options.replacePath
      ? Object.freeze({
          from: options.replacePath.from,
          to: options.replacePath.to,
        })
      : null,
    editor,
    bindings: encodeBindings(options.bindings),
    hrefTarget: options.hrefTarget,
    tmuxSession: options.tmuxSession,
    disabled: options.disabled,
    debugMode: options.debugMode,
    showIntro: options.showIntro,
  });
}

export function configProvenance(
  config: ResolvedConfig
): Readonly<Record<ConfigField, LocatorLayerId>> {
  return Object.freeze({
    adapter: config.fields.adapter.source,
    projectPath: config.fields.projectPath.source,
    replacePath: config.fields.replacePath.source,
    editor: config.fields.editor.source,
    bindings: config.fields.bindings.source,
    hrefTarget: config.fields.hrefTarget.source,
    tmuxSession: config.fields.tmuxSession.source,
    disabled: config.fields.disabled.source,
    debugMode: config.fields.debugMode.source,
    showIntro: config.fields.showIntro.source,
  });
}

export function modifierChordFromState(state: {
  alt: boolean;
  ctrl: boolean;
  shift: boolean;
  meta: boolean;
}): ModifierChord | null {
  const mask =
    (state.alt ? MODIFIER_BITS.alt : 0) |
    (state.ctrl ? MODIFIER_BITS.ctrl : 0) |
    (state.shift ? MODIFIER_BITS.shift : 0) |
    (state.meta ? MODIFIER_BITS.meta : 0);
  return mask === 0 ? null : (mask as ModifierChord);
}

export function shortcutAction(
  bindings: Bindings,
  chord: ModifierChord | null
): ConfiguredAction | undefined {
  return chord === null ? undefined : bindings.shortcuts[chord];
}

export function toolbarActions(
  bindings: Bindings
): readonly ConfiguredAction[] {
  return bindings.toolbar;
}

export function rewritePath(rewrite: PathRewrite, value: string): string {
  const expression = rewriteExpressions.get(rewrite);
  if (!expression) {
    throw new Error(
      "Path rewrite was not created by the configuration parser."
    );
  }
  return value.replace(expression, rewrite.to);
}

export function resolveEditorDestination(
  destination: EditorChoice,
  targets: TargetRegistry
): EffectiveEditor {
  return resolveEditor(destination, "team", targets);
}

export function resolveActionEditor(
  action: Extract<ConfiguredAction, { kind: "open-editor" }>,
  inherited: EffectiveEditor,
  targets: TargetRegistry
): EffectiveEditor {
  return action.destination.kind === "inherit"
    ? inherited
    : resolveEditorDestination(action.destination, targets);
}

export function findTarget(
  targets: TargetRegistry,
  id: string
): TargetDefinition | undefined {
  return targets.byId[id];
}

export function targetRegistryView(targets: TargetRegistry): TargetViewMap {
  const view: Record<string, TargetView> = Object.create(null) as Record<
    string,
    TargetView
  >;
  for (const target of targets.entries) {
    view[target.id] = Object.freeze({ url: target.url, label: target.label });
  }
  return Object.freeze(view);
}

const BUILT_IN_TARGET_INPUT = Object.freeze({
  vscode: Object.freeze({
    url: "vscode://file/${projectPath}${filePath}:${line}:${column}",
    label: "VSCode",
  }),
  webstorm: Object.freeze({
    url: "webstorm://open?file=${projectPath}${filePath}&line=${line}&column=${column}",
    label: "WebStorm",
  }),
  cursor: Object.freeze({
    url: "cursor://file/${projectPath}${filePath}:${line}:${column}",
    label: "Cursor",
  }),
  windsurf: Object.freeze({
    url: "windsurf://file/${projectPath}${filePath}:${line}:${column}",
    label: "Windsurf",
  }),
  zed: Object.freeze({
    url: "zed://file${projectPath}${filePath}:${line}:${column}",
    label: "Zed",
  }),
  antigravity: Object.freeze({
    url: "antigravity://file/${projectPath}${filePath}:${line}:${column}",
    label: "Antigravity",
  }),
  nvim: Object.freeze({
    url: "nvim://file/${projectPath}${filePath}:${line}:${column}?tmux-session=${tmuxSession}",
    label: "Neovim (macOS only)",
  }),
});

const builtInErrors: ConfigError[] = [];
const parsedBuiltIns = parseTargetRegistry(
  BUILT_IN_TARGET_INPUT,
  "/targets",
  builtInErrors
);
if (!parsedBuiltIns || builtInErrors.length > 0) {
  throw new Error("Built-in Locator targets are invalid.");
}
export const BUILT_IN_TARGETS = parsedBuiltIns;

const emptyLayerResult = parseLayer({});
if (!emptyLayerResult.ok) throw new Error("Empty Locator layer is invalid.");
export const EMPTY_LAYER = emptyLayerResult.value;

const defaultBindingResult = parseBindings(
  [
    {
      trigger: { kind: "modifier-click", modifiers: ["alt"] },
      action: { kind: "open-editor" },
    },
    { trigger: { kind: "hover-toolbar" }, action: { kind: "show-tree" } },
    {
      trigger: { kind: "hover-toolbar" },
      action: { kind: "show-parents" },
    },
    { trigger: { kind: "hover-toolbar" }, action: { kind: "copy-path" } },
  ],
  "/bindings",
  []
);
if (!defaultBindingResult)
  throw new Error("Default Locator bindings are invalid.");
const DEFAULT_BINDINGS = defaultBindingResult;
const DEFAULT_EDITOR = Object.freeze({
  kind: "target",
  id: "vscode" as TargetId,
}) as EditorChoice;

export const DEFAULT_LAYER = Object.freeze({
  editor: DEFAULT_EDITOR,
  bindings: DEFAULT_BINDINGS,
  hrefTarget: "_self",
  disabled: false,
  debugMode: false,
  showIntro: true,
}) as LocatorLayer;

const defaultOpenEditorResult = parseAction({ kind: "open-editor" });
if (!defaultOpenEditorResult.ok) {
  throw new Error("Default open-editor action is invalid.");
}
export const DEFAULT_OPEN_EDITOR_ACTION = defaultOpenEditorResult.value;
