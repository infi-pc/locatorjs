import type { OptionsStore } from "./optionsStore";

export function getMouseModifiers(options: OptionsStore) {
  const mouseModifiers = options.effective().mouseModifiers ?? "alt";
  const mouseModifiersArray = mouseModifiers.split("+");
  const modifiers: { [key: string]: true } = {};
  mouseModifiersArray.forEach((modifier) => {
    modifiers[modifier] = true;
  });

  return modifiers;
}

export function isCombinationModifiersPressed(
  options: OptionsStore,
  e: MouseEvent | KeyboardEvent,
  rightClick = false
) {
  const modifiers = getMouseModifiers(options);

  if (rightClick) {
    return (
      e.altKey == !!modifiers.alt &&
      e.metaKey == !!modifiers.meta &&
      e.shiftKey == !!modifiers.shift
    );
  }
  return (
    e.altKey == !!modifiers.alt &&
    e.ctrlKey == !!modifiers.ctrl &&
    e.metaKey == !!modifiers.meta &&
    e.shiftKey == !!modifiers.shift
  );
}
