import { isValidRenderer } from "./isValidRenderer";
export { isValidRenderer };
export * from "./types";
export * from "./targets";
export * from "./modifiers";
export * from "./environmentDetection";
export * from "./shadowRootRegistry";

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
export * from "./optionsCodec";
export * from "./actionLabel";
export * from "./targetTemplate";
export * from "./windowMessaging";
export * from "./tryActionResult";
