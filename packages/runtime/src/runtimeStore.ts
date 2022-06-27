import { buidLink } from "./buidLink";
import { LabelData } from "./LabelData";
import { parseDataId } from "./parseDataId";

type SourceLocation = {
  start: {
    line: number;
    column: number;
  };
  end: {
    line: number;
    column: number;
  };
};

type ExpressionInfo =
  | {
      type: "jsx";
      name: string;
      wrappingComponent: string | null;
      loc: SourceLocation | null;
    }
  | {
      type: "styledComponent";
      name: string | null;
      loc: SourceLocation | null;
      htmlTag: string | null;
    };

type FileStorage = {
  filePath: string;
  projectPath: string;
  nextId: number;
  expressions: ExpressionInfo[];
};

export const dataByFilename: { [filename: string]: FileStorage } = {};

export function getDataForDataId(dataId: string): LabelData | null {
  const [fileFullPath, id] = parseDataId(dataId);

  const fileData = dataByFilename[fileFullPath];
  if (!fileData) {
    return null;
  }
  const expData = fileData.expressions[Number(id)];
  if (!expData) {
    return null;
  }

  const link = buidLink(fileData.filePath, fileData.projectPath, expData.loc);

  let label;
  if (expData.type === "jsx") {
    label =
      (expData.wrappingComponent ? `${expData.wrappingComponent}: ` : "") +
      expData.name;
  } else {
    label = `${expData.htmlTag ? `styled.${expData.htmlTag}` : "styled"}${
      expData.name ? `: ${expData.name}` : ""
    }`;
  }

  return { link, label };
}

export function register(input: any) {
  dataByFilename[input.projectPath + input.filePath] = input;
}
