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

export function matchBinding(
  bindings: Binding[],
  event: ModifierEvent,
  config: { ignoreCtrl?: boolean } = {}
): Binding | null {
  return (
    bindings.find((binding) => {
      if (binding.trigger.kind !== "modifier-click") return false;
      const expected = new Set(
        binding.trigger.modifiers
          .split("+")
          .map((item) => item.trim())
          .filter(Boolean)
      );
      return (
        event.altKey === expected.has("alt") &&
        (config.ignoreCtrl || event.ctrlKey === expected.has("ctrl")) &&
        event.metaKey === expected.has("meta") &&
        event.shiftKey === expected.has("shift")
      );
    }) ?? null
  );
}
