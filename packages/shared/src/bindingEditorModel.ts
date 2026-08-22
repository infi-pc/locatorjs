import {
  hasEditorOverride,
  primaryEditorBinding,
  type Binding,
  type BindingAction,
  type BindingTrigger,
} from "./layeredOptions";

export const MAX_BINDINGS_PER_TRIGGER = 6;

const PREFERRED_MODIFIER_COMBINATIONS = [
  "alt",
  "alt+shift",
  "ctrl",
  "ctrl+shift",
  "meta",
  "meta+shift",
] as const;

export function bindingsForTrigger(
  bindings: Binding[],
  kind: BindingTrigger["kind"]
): Binding[] {
  return bindings.filter((binding) => binding.trigger.kind === kind);
}

export function bindingAt(
  bindings: Binding[],
  kind: BindingTrigger["kind"],
  index: number
): Binding | undefined {
  return bindingsForTrigger(bindings, kind)[index];
}

export function globalIndexForTrigger(
  bindings: Binding[],
  kind: BindingTrigger["kind"],
  groupIndex: number
): number {
  let seen = -1;
  return bindings.findIndex((binding) => {
    if (binding.trigger.kind !== kind) return false;
    seen += 1;
    return seen === groupIndex;
  });
}

export function canAddBinding(
  bindings: Binding[],
  kind: BindingTrigger["kind"]
): boolean {
  return bindingsForTrigger(bindings, kind).length < MAX_BINDINGS_PER_TRIGGER;
}

export function nextAvailableModifiers(bindings: Binding[]): string {
  const used = new Set(
    bindings.flatMap((binding) =>
      binding.trigger.kind === "modifier-click"
        ? [binding.trigger.modifiers]
        : []
    )
  );
  return (
    PREFERRED_MODIFIER_COMBINATIONS.find((value) => !used.has(value)) ?? "alt"
  );
}

export function duplicateShortcutModifiers(bindings: Binding[]): Set<string> {
  const counts = new Map<string, number>();
  for (const binding of bindings) {
    if (binding.trigger.kind !== "modifier-click") continue;
    const modifiers = binding.trigger.modifiers;
    counts.set(modifiers, (counts.get(modifiers) ?? 0) + 1);
  }
  return new Set(
    [...counts].filter(([, count]) => count > 1).map(([modifiers]) => modifiers)
  );
}

export function hasShortcutConflict(
  binding: Binding,
  bindings: Binding[]
): boolean {
  if (binding.trigger.kind !== "modifier-click") return false;
  const modifiers = binding.trigger.modifiers;
  return bindings.some(
    (candidate) =>
      candidate.trigger.kind === "modifier-click" &&
      candidate.trigger.modifiers === modifiers
  );
}

/**
 * New actions carry no editor override, so they follow the global Editor
 * setting until the user deliberately pins one.
 */
export function defaultBindingAction(kind: string): BindingAction {
  switch (kind) {
    case "copy-path":
      return { kind: "copy-path" };
    case "copy-prompt":
      return { kind: "copy-prompt" };
    case "open-prompt":
      return { kind: "open-prompt", app: "cursor" };
    case "show-tree":
      return { kind: "show-tree" };
    case "show-parents":
      return { kind: "show-parents" };
    case "open-editor":
    default:
      return { kind: "open-editor" };
  }
}

export function createBindingDraft(
  triggerKind: BindingTrigger["kind"],
  bindings: Binding[]
): Binding {
  return {
    trigger:
      triggerKind === "modifier-click"
        ? {
            kind: "modifier-click",
            modifiers: nextAvailableModifiers(bindings),
          }
        : { kind: "hover-toolbar" },
    action: defaultBindingAction("open-editor"),
  };
}

export function insertBinding(
  bindings: Binding[],
  binding: Binding
): Binding[] | undefined {
  const triggerKind = binding.trigger.kind;
  if (!canAddBinding(bindings, triggerKind)) return undefined;
  const modifierBindings = bindingsForTrigger(bindings, "modifier-click");
  const toolbarBindings = bindingsForTrigger(bindings, "hover-toolbar");
  return triggerKind === "modifier-click"
    ? [...modifierBindings, binding, ...toolbarBindings]
    : [...modifierBindings, ...toolbarBindings, binding];
}

/**
 * Points the primary editor action back at the global Editor setting, so
 * picking an editor during onboarding is not silently shadowed by an override
 * left on the binding.
 */
export function clearPrimaryEditorOverride(
  bindings: Binding[]
): Binding[] | undefined {
  const primary = primaryEditorBinding(bindings);
  if (!primary) return undefined;
  const index = bindings.indexOf(primary);
  if (index < 0) return undefined;
  const action = primary.action;
  if (action.kind !== "open-editor" || !hasEditorOverride(action)) {
    return undefined;
  }
  return bindings.map((binding, bindingIndex) =>
    bindingIndex === index
      ? { ...binding, action: { kind: "open-editor" as const } }
      : binding
  );
}
