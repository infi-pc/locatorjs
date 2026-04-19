import { isValidRenderer } from "./isValidRenderer";
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
  cursor: {
    url: "cursor://file/${projectPath}${filePath}:${line}:${column}",
    label: "Cursor",
  },
  windsurf: {
    url: "windsurf://file/${projectPath}${filePath}:${line}:${column}",
    label: "Windsurf",
  },
  antigravity: {
    url: "antigravity://file/${projectPath}${filePath}:${line}:${column}",
    label: "Antigravity",
  },
  nvim: {
    url: "nvim://file/${projectPath}${filePath}:${line}:${column}",
    label: "Neovim (macOS only)",
  },
};

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
  // @ts-expect-error accessing window globals
  if (window.__SVELTE_HMR) {
    // __SVELTE_HMR is so far the only way to detect svelte I found
    return true;
  }

  // @ts-expect-error accessing window globals
  if (window.__SAPPER__) {
    return true;
  }
  return false;
}

export function detectVue() {
  // @ts-expect-error accessing window globals
  if (window.__VUE__) {
    return true;
  }
  return false;
}

export function detectJSX() {
  // @ts-expect-error accessing window globals
  if (window.__LOCATOR_DATA__) {
    return true;
  }
  return false;
}

export function detectReact() {
  // @ts-expect-error accessing window globals
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    // @ts-expect-error accessing window globals
    const renderersMap = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers;
    if (renderersMap) {
      const problematicRenderers: string[] = [];
      const renderers = Array.from(renderersMap.values()).filter(
        (renderer: any) => {
          return isValidRenderer(renderer, (msg) => {
            problematicRenderers.push(msg);
          });
        }
      );
      if (renderers.length) {
        return true;
      }
    }
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

export * from "./sharedOptionsStore";
