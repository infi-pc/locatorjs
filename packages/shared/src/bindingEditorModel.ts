import type {
  BindingAction,
  BindingInput,
  BindingTrigger,
  Modifier,
} from "./config";

export const MAX_BINDINGS_PER_TRIGGER = 6;

const PREFERRED_MODIFIER_COMBINATIONS = [
  ["alt"],
  ["alt", "shift"],
  ["ctrl"],
  ["ctrl", "shift"],
  ["meta"],
  ["meta", "shift"],
] as const satisfies readonly (readonly [Modifier, ...Modifier[]])[];

function chordKey(modifiers: readonly Modifier[]): string {
  return modifiers.join("+");
}

export function bindingsForTrigger(
  bindings: readonly BindingInput[],
  kind: BindingTrigger["kind"]
): BindingInput[] {
  return bindings.filter((binding) => binding.trigger.kind === kind);
}

export function bindingAt(
  bindings: readonly BindingInput[],
  kind: BindingTrigger["kind"],
  index: number
): BindingInput | undefined {
  return bindingsForTrigger(bindings, kind)[index];
}

export function globalIndexForTrigger(
  bindings: readonly BindingInput[],
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
  bindings: readonly BindingInput[],
  kind: BindingTrigger["kind"]
): boolean {
  return bindingsForTrigger(bindings, kind).length < MAX_BINDINGS_PER_TRIGGER;
}

export function nextAvailableModifiers(
  bindings: readonly BindingInput[]
): readonly [Modifier, ...Modifier[]] {
  const used = new Set(
    bindings.flatMap((binding) =>
      binding.trigger.kind === "modifier-click"
        ? [chordKey(binding.trigger.modifiers)]
        : []
    )
  );
  return (
    PREFERRED_MODIFIER_COMBINATIONS.find(
      (value) => !used.has(chordKey(value))
    ) ?? PREFERRED_MODIFIER_COMBINATIONS[0]
  );
}

export function duplicateShortcutModifiers(
  bindings: readonly BindingInput[]
): Set<string> {
  const counts = new Map<string, number>();
  for (const binding of bindings) {
    if (binding.trigger.kind !== "modifier-click") continue;
    const key = chordKey(binding.trigger.modifiers);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Set(
    [...counts].filter(([, count]) => count > 1).map(([key]) => key)
  );
}

export function hasShortcutConflict(
  binding: BindingInput,
  bindings: readonly BindingInput[]
): boolean {
  if (binding.trigger.kind !== "modifier-click") return false;
  const key = chordKey(binding.trigger.modifiers);
  return bindings.some(
    (candidate) =>
      candidate.trigger.kind === "modifier-click" &&
      chordKey(candidate.trigger.modifiers) === key
  );
}

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
    default:
      return { kind: "open-editor" };
  }
}

export function createBindingDraft(
  triggerKind: BindingTrigger["kind"],
  bindings: readonly BindingInput[]
): BindingInput {
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
  bindings: readonly BindingInput[],
  binding: BindingInput
): BindingInput[] | undefined {
  const triggerKind = binding.trigger.kind;
  if (!canAddBinding(bindings, triggerKind)) return undefined;
  const shortcuts = bindingsForTrigger(bindings, "modifier-click");
  const toolbar = bindingsForTrigger(bindings, "hover-toolbar");
  return triggerKind === "modifier-click"
    ? [...shortcuts, binding, ...toolbar]
    : [...shortcuts, ...toolbar, binding];
}

export function clearPrimaryEditorOverride(
  bindings: readonly BindingInput[]
): BindingInput[] | undefined {
  const index = bindings.findIndex(
    (binding) => binding.action.kind === "open-editor"
  );
  if (index < 0) return undefined;
  const action = bindings[index]?.action;
  if (action?.kind !== "open-editor" || action.destination === undefined) {
    return undefined;
  }
  return bindings.map((binding, bindingIndex) =>
    bindingIndex === index
      ? { ...binding, action: { kind: "open-editor" as const } }
      : binding
  );
}
