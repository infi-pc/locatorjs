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
