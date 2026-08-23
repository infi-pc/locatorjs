export const isMac =
  typeof navigator !== "undefined" &&
  navigator.platform.toUpperCase().indexOf("MAC") >= 0;

export const altTitle = isMac ? "⌥ Option" : "Alt";
export const shiftTitle = isMac ? "⇧ Shift" : "Shift";
export const ctrlTitle = isMac ? "⌃ Ctrl" : "Ctrl";
export const metaTitle = isMac ? "⌘ Command" : "Windows";

export const modifiersTitles = {
  alt: altTitle,
  ctrl: ctrlTitle,
  meta: metaTitle,
  shift: shiftTitle,
};

export function getModifiersMap(modifiersString: string) {
  const mouseModifiersArray = modifiersString
    .split("+")
    .map((modifier) => modifier.trim())
    .filter(Boolean);
  const modifiersMap: { [key: string]: true } = {};
  mouseModifiersArray.forEach((modifier) => {
    modifiersMap[modifier] = true;
  }, {});
  return modifiersMap;
}

/**
 * The order a combination is written in. The runtime matcher is
 * order-insensitive, but every editor guard compares the raw strings, so
 * `"shift+alt"` and `"alt+shift"` reading as two different shortcuts is what
 * let two bindings claim the same combination with no duplicate warning.
 */
const MODIFIER_ORDER = ["alt", "ctrl", "shift", "meta"];

export function getModifiersString(modifiersMap: { [key: string]: true }) {
  const keys = Object.keys(modifiersMap);
  return [
    ...MODIFIER_ORDER.filter((modifier) => keys.includes(modifier)),
    // Anything unrecognised still round-trips, just after the known ones.
    ...keys.filter((key) => !MODIFIER_ORDER.includes(key)).sort(),
  ].join("+");
}

/** The one spelling of a combination, whatever order it arrived in. */
export function canonicalModifiers(modifiersString: string): string {
  return getModifiersString(getModifiersMap(modifiersString));
}
