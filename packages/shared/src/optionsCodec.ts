import type {
  Binding,
  BindingAction,
  BindingTrigger,
  LocatorLayer,
  LocatorOptions,
} from "./layeredOptions";
import type { Target, Targets } from "./targets";
import { isSafeTargetTemplate } from "./targetTemplate";
export { isSafeTargetTemplate } from "./targetTemplate";

export const LOCATOR_OPTION_KEYS = [
  "adapterId",
  "projectPath",
  "replacePath",
  "editor",
  "bindings",
  "mouseModifiers",
  "hrefTarget",
  "tmuxSession",
  "disabled",
  "debugMode",
  "showIntro",
] as const satisfies readonly (keyof LocatorOptions)[];

const OPTION_KEYS = new Set<string>(LOCATOR_OPTION_KEYS);
const LAYERS = new Set<LocatorLayer>([
  "default",
  "team",
  "user-extension",
  "user-origin",
]);

type OptionDecoder<K extends keyof LocatorOptions> = (
  value: unknown
) => LocatorOptions[K] | null;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key));
}

export function decodeBindingTrigger(value: unknown): BindingTrigger | null {
  if (!isPlainObject(value) || typeof value.kind !== "string") return null;
  if (value.kind === "hover-toolbar") {
    return hasOnlyKeys(value, ["kind"]) ? { kind: "hover-toolbar" } : null;
  }
  if (
    value.kind === "modifier-click" &&
    typeof value.modifiers === "string" &&
    hasOnlyKeys(value, ["kind", "modifiers"])
  ) {
    return { kind: "modifier-click", modifiers: value.modifiers };
  }
  return null;
}

export function decodeBindingAction(value: unknown): BindingAction | null {
  if (!isPlainObject(value) || typeof value.kind !== "string") return null;
  switch (value.kind) {
    case "copy-path":
    case "show-tree":
    case "show-parents":
      return hasOnlyKeys(value, ["kind"]) ? { kind: value.kind } : null;
    case "copy-prompt":
      return (value.template === undefined ||
        typeof value.template === "string") &&
        hasOnlyKeys(value, ["kind", "template"])
        ? {
            kind: "copy-prompt",
            template: value.template as string | undefined,
          }
        : null;
    case "open-prompt":
      return (value.app === "cursor" || value.app === "windsurf") &&
        (value.template === undefined || typeof value.template === "string") &&
        hasOnlyKeys(value, ["kind", "app", "template"])
        ? {
            kind: "open-prompt",
            app: value.app,
            template: value.template as string | undefined,
          }
        : null;
    case "open-editor": {
      if (!hasOnlyKeys(value, ["kind", "targetId", "targetTemplate"])) {
        return null;
      }
      if (value.targetId !== undefined && typeof value.targetId !== "string") {
        return null;
      }
      if (
        value.targetTemplate !== undefined &&
        (typeof value.targetTemplate !== "string" ||
          !isSafeTargetTemplate(value.targetTemplate))
      ) {
        return null;
      }
      return {
        kind: "open-editor",
        ...(typeof value.targetId === "string"
          ? { targetId: value.targetId }
          : {}),
        ...(typeof value.targetTemplate === "string"
          ? { targetTemplate: value.targetTemplate }
          : {}),
      };
    }
    default:
      return null;
  }
}

export function decodeBinding(value: unknown): Binding | null {
  if (!isPlainObject(value) || !hasOnlyKeys(value, ["trigger", "action"])) {
    return null;
  }
  const trigger = decodeBindingTrigger(value.trigger);
  const action = decodeBindingAction(value.action);
  return trigger && action ? { trigger, action } : null;
}

const stringOption = (value: unknown) =>
  typeof value === "string" ? value : null;
const booleanOption = (value: unknown) =>
  typeof value === "boolean" ? value : null;

const OPTION_DECODERS = {
  adapterId: stringOption,
  projectPath: stringOption,
  replacePath: (value) => {
    if (
      !isPlainObject(value) ||
      !hasOnlyKeys(value, ["from", "to"]) ||
      typeof value.from !== "string" ||
      typeof value.to !== "string"
    ) {
      return null;
    }
    return { from: value.from, to: value.to };
  },
  editor: (value) => {
    if (
      !isPlainObject(value) ||
      !hasOnlyKeys(value, ["targetId", "targetTemplate"]) ||
      (value.targetId !== undefined && typeof value.targetId !== "string") ||
      (value.targetTemplate !== undefined &&
        (typeof value.targetTemplate !== "string" ||
          !isSafeTargetTemplate(value.targetTemplate)))
    ) {
      return null;
    }
    const editor = {
      ...(typeof value.targetId === "string"
        ? { targetId: value.targetId }
        : {}),
      ...(typeof value.targetTemplate === "string"
        ? { targetTemplate: value.targetTemplate }
        : {}),
    };
    return Object.keys(editor).length > 0 ? editor : undefined;
  },
  bindings: (value) => {
    if (!Array.isArray(value)) return null;
    const bindings = value.map(decodeBinding);
    return bindings.some((binding) => binding === null)
      ? null
      : (bindings as Binding[]);
  },
  mouseModifiers: stringOption,
  hrefTarget: (value) =>
    value === "_blank" || value === "_self" ? value : null,
  tmuxSession: stringOption,
  disabled: booleanOption,
  debugMode: booleanOption,
  showIntro: booleanOption,
} satisfies {
  [K in keyof Required<LocatorOptions>]: OptionDecoder<K>;
};

function decodeOptions(
  value: unknown,
  tolerateInvalidFields: boolean
): LocatorOptions | null {
  if (!isPlainObject(value)) return null;
  if (
    !tolerateInvalidFields &&
    Object.keys(value).some((key) => !OPTION_KEYS.has(key))
  ) {
    return null;
  }

  const decoded: LocatorOptions = {};
  for (const key of LOCATOR_OPTION_KEYS) {
    const field = value[key];
    if (field === undefined) continue;
    const decodedField = OPTION_DECODERS[key](field) as
      | LocatorOptions[typeof key]
      | null;
    if (decodedField === null) {
      if (tolerateInvalidFields) continue;
      return null;
    }
    if (decodedField !== undefined) {
      (decoded as Record<string, unknown>)[key] = decodedField;
    }
  }
  return decoded;
}

export function decodeLocatorOptions(value: unknown): LocatorOptions | null {
  return decodeOptions(value, false);
}

/**
 * Storage is long-lived and can outlive an option or extension version. Keep
 * every independently valid field instead of discarding all settings because
 * one field was written by a newer or broken version.
 */
export function decodeStoredLocatorOptions(
  value: unknown
): LocatorOptions | null {
  return decodeOptions(value, true);
}

export function decodeLocatorLayers(
  value: unknown
): Partial<Record<LocatorLayer, LocatorOptions>> | null {
  if (!isPlainObject(value)) return null;
  const result: Partial<Record<LocatorLayer, LocatorOptions>> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!LAYERS.has(key as LocatorLayer)) return null;
    const options = decodeLocatorOptions(raw);
    if (!options) return null;
    result[key as LocatorLayer] = options;
  }
  return result;
}

export function decodeProvenance(
  value: unknown
): Partial<Record<keyof LocatorOptions, LocatorLayer>> | null {
  if (!isPlainObject(value)) return null;
  const result: Partial<Record<keyof LocatorOptions, LocatorLayer>> = {};
  for (const [key, layer] of Object.entries(value)) {
    if (!OPTION_KEYS.has(key) || !LAYERS.has(layer as LocatorLayer))
      return null;
    result[key as keyof LocatorOptions] = layer as LocatorLayer;
  }
  return result;
}

function decodeTarget(value: unknown): Target | null {
  if (
    !isPlainObject(value) ||
    !hasOnlyKeys(value, ["url", "label"]) ||
    typeof value.url !== "string" ||
    typeof value.label !== "string" ||
    !isSafeTargetTemplate(value.url)
  ) {
    return null;
  }
  return { url: value.url, label: value.label };
}

export function decodeTargets(value: unknown): Targets | null {
  if (!isPlainObject(value)) return null;
  const result: Targets = Object.create(null) as Targets;
  for (const [key, raw] of Object.entries(value)) {
    const target = decodeTarget(raw);
    if (!target) return null;
    result[key] = target;
  }
  return result;
}
