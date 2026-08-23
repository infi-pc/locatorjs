import { isValidRenderer } from "./isValidRenderer";
export * from "./types";
export * from "./targets";
export * from "./modifiers";

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
export * from "./layeredOptions";
export * from "./sourcePath";
export * from "./bindingEditorModel";
export * from "./migrateLegacyStorage";
export * from "./patchCodec";
