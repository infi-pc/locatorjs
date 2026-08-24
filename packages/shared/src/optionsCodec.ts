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

export function decodeLocatorOptions(value: unknown): LocatorOptions | null {
  if (
    !isPlainObject(value) ||
    Object.keys(value).some((key) => !OPTION_KEYS.has(key))
  ) {
    return null;
  }

  const decoded: LocatorOptions = {};
  for (const key of [
    "adapterId",
    "projectPath",
    "mouseModifiers",
    "tmuxSession",
  ] as const) {
    const field = value[key];
    if (field !== undefined) {
      if (typeof field !== "string") return null;
      decoded[key] = field;
    }
  }
  for (const key of ["disabled", "debugMode", "showIntro"] as const) {
    const field = value[key];
    if (field !== undefined) {
      if (typeof field !== "boolean") return null;
      decoded[key] = field;
    }
  }
  if (value.hrefTarget !== undefined) {
    if (value.hrefTarget !== "_blank" && value.hrefTarget !== "_self")
      return null;
    decoded.hrefTarget = value.hrefTarget;
  }
  if (value.replacePath !== undefined) {
    if (
      !isPlainObject(value.replacePath) ||
      !hasOnlyKeys(value.replacePath, ["from", "to"]) ||
      typeof value.replacePath.from !== "string" ||
      typeof value.replacePath.to !== "string"
    ) {
      return null;
    }
    decoded.replacePath = {
      from: value.replacePath.from,
      to: value.replacePath.to,
    };
  }
  if (value.editor !== undefined) {
    if (
      !isPlainObject(value.editor) ||
      !hasOnlyKeys(value.editor, ["targetId", "targetTemplate"]) ||
      (value.editor.targetId !== undefined &&
        typeof value.editor.targetId !== "string") ||
      (value.editor.targetTemplate !== undefined &&
        (typeof value.editor.targetTemplate !== "string" ||
          !isSafeTargetTemplate(value.editor.targetTemplate)))
    ) {
      return null;
    }
    decoded.editor = {
      ...(typeof value.editor.targetId === "string"
        ? { targetId: value.editor.targetId }
        : {}),
      ...(typeof value.editor.targetTemplate === "string"
        ? { targetTemplate: value.editor.targetTemplate }
        : {}),
    };
  }
  if (value.bindings !== undefined) {
    if (!Array.isArray(value.bindings)) return null;
    const bindings = value.bindings.map(decodeBinding);
    if (bindings.some((binding) => binding === null)) return null;
    decoded.bindings = bindings as Binding[];
  }
  return decoded;
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
