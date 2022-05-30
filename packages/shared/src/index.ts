export * from "./types";

export type Target = {
  url: string;
  label: string;
};

export type Targets = { [k: string]: Target };

export const allTargets: Targets = {
  vscode: {
    url: "vscode://file${projectPath}${filePath}:${line}:${column}",
    label: "VSCode",
  },
  webstorm: {
    url: "webstorm://open?file=${projectPath}${filePath}&line=${line}&column=${column}",
    label: "WebStorm",
  },
  atom: {
    url: "atom://core/open/file?filename=${projectPath}${filePath}&line=${line}&column=${column}",
    label: "Atom",
  },
};

export const isMac =
  // @ts-ignore
  typeof navigator !== "undefined" &&
  // @ts-ignore
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
  const mouseModifiersArray = modifiersString.split("+").filter(Boolean);
  const modifiersMap: { [key: string]: true } = {};
  mouseModifiersArray.forEach((modifier) => {
    modifiersMap[modifier] = true;
  }, {});
  return modifiersMap;
}

export function getModifiersString(modifiersMap: { [key: string]: true }) {
  const modifiersArray = Object.keys(modifiersMap);
  return modifiersArray.join("+");
}
