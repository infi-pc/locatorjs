export * from "./types";

export type Target = {
  url: string;
  label: string;
  // target?: "_blank" | "_self" | "_parent" | "_top" | string;
};

export type Targets = { [k: string]: Target };

export const allTargets: Targets = {
  vscode: {
    url: "vscode://file/${projectPath}${filePath}:${line}:${column}",
    label: "VSCode",
  },
  webstorm: {
    url: "webstorm://open?file=${projectPath}${filePath}&line=${line}&column=${column}",
    label: "WebStorm",
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

export function detectSvelte() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (window.__SVELTE_HMR) {
    // __SVELTE_HMR is so far the only way to detect svelte I found
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (window.__SAPPER__) {
    return true;
  }
  return false;
}

export function detectVue() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (window.__VUE__) {
    return true;
  }
  return false;
}

export type SourceLocation = {
  start: {
    line: number;
    column: number;
  };
  end: {
    line: number;
    column: number;
  };
};

export type ComponentInfo = {
  name: string;
  loc: SourceLocation | null;
};

export type ExpressionInfo = {
  name: string;
  loc: SourceLocation;
  wrappingComponentId: number | null;
};

export type StyledDefinitionInfo = {
  name: string | null;
  loc: SourceLocation;
  htmlTag: string;
};

export type FileStorage = {
  filePath: string;
  projectPath: string;
  expressions: ExpressionInfo[];
  styledDefinitions: StyledDefinitionInfo[];
  components: ComponentInfo[];
};
