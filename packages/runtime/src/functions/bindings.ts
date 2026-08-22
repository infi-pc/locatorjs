import {
  DEFAULT_LAYER,
  normalizeLayer,
  type Binding,
  type LocatorOptions,
} from "@locator/shared";

type ModifierEvent = Pick<
  MouseEvent | KeyboardEvent,
  "altKey" | "ctrlKey" | "metaKey" | "shiftKey"
>;

export function effectiveBindings(options: LocatorOptions): Binding[] {
  return normalizeLayer(options).bindings ?? DEFAULT_LAYER.bindings ?? [];
}

export function iconBindings(bindings: Binding[]): Binding[] {
  return bindings.filter((binding) => binding.trigger.kind === "hover-toolbar");
}

/**
 * Modifier combination that reveals the outline and its hover toolbar when no
 * modifier-click binding defines one. Without this the toolbar — and with it
 * the tree and parents actions — would be unreachable for anyone who deleted
 * every shortcut.
 */
export const FALLBACK_ACTIVATION_MODIFIERS = "alt";

function parseModifiers(modifiers: string): Set<string> {
  return new Set(
    modifiers
      .split("+")
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function matchesModifiers(
  expected: Set<string>,
  event: ModifierEvent,
  config: { ignoreCtrl?: boolean } = {}
): boolean {
  return (
    event.altKey === expected.has("alt") &&
    (config.ignoreCtrl || event.ctrlKey === expected.has("ctrl")) &&
    event.metaKey === expected.has("meta") &&
    event.shiftKey === expected.has("shift")
  );
}

export function matchBinding(
  bindings: Binding[],
  event: ModifierEvent,
  config: { ignoreCtrl?: boolean } = {}
): Binding | null {
  return (
    bindings.find((binding) => {
      if (binding.trigger.kind !== "modifier-click") return false;
      return matchesModifiers(
        parseModifiers(binding.trigger.modifiers),
        event,
        config
      );
    }) ?? null
  );
}

/**
 * Every modifier combination that reveals the outline: whatever the shortcuts
 * use, or the fallback when there are only toolbar actions.
 */
export function activationModifiers(bindings: Binding[]): string[] {
  const fromShortcuts = bindings.flatMap((binding) =>
    binding.trigger.kind === "modifier-click" ? [binding.trigger.modifiers] : []
  );
  return fromShortcuts.length
    ? Array.from(new Set(fromShortcuts))
    : [FALLBACK_ACTIVATION_MODIFIERS];
}

/** True while the user is holding a combination that reveals the outline. */
export function matchesActivation(
  bindings: Binding[],
  event: ModifierEvent
): boolean {
  return activationModifiers(bindings).some((modifiers) =>
    matchesModifiers(parseModifiers(modifiers), event)
  );
}
