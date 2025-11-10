import {
  parseDataId,
  parseDataPath,
  splitFullPath,
} from "../../functions/parseDataId";

export function getDataForDataId(dataId: string) {
  let fileFullPath: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let expData: any;
  let filePath = "";
  let projectPath = "";

  const data = window.__LOCATOR_DATA__;

  // Try parsing as path format first (new format)
  const pathParsed = parseDataPath(dataId);
  if (pathParsed) {
    const [fullPath, line, column] = pathParsed;
    fileFullPath = fullPath;

    if (data) {
      const fileData = data[fileFullPath];
      if (fileData) {
        // Find expression by location
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expData = fileData.expressions.find(
          (exp: any) =>
            exp.loc.start.line === line && exp.loc.start.column === column
        );
        if (expData) {
          filePath = fileData.filePath;
          projectPath = fileData.projectPath;
        }
      }
    }

    // If no data or not found, create minimal data from path
    if (!expData) {
      [projectPath, filePath] = splitFullPath(fullPath);
      expData = {
        name: "Component",
        loc: {
          start: { line, column },
          end: { line, column },
        },
        wrappingComponentId: null,
      };
    }
  } else {
    // Fall back to ID format (old format) - requires __LOCATOR_DATA__
    if (!data) {
      return null;
    }

    const [fullPath, id] = parseDataId(dataId);
    fileFullPath = fullPath;
    const fileData = data[fileFullPath];
    if (!fileData) {
      return null;
    }
    expData = fileData.expressions[Number(id)];
    filePath = fileData.filePath;
    projectPath = fileData.projectPath;
  }

  if (!expData) {
    return null;
  }

  const link = {
    filePath,
    projectPath,
    column: expData.loc.start.column || 0,
    line: expData.loc.start.line || 0,
  };

  // let label;
  // if (expData.type === "jsx") {
  //   label =
  //     (expData.wrappingComponent ? `${expData.wrappingComponent}: ` : "") +
  //     expData.name;
  // } else {
  //   label = `${expData.htmlTag ? `styled.${expData.htmlTag}` : "styled"}${
  //     expData.name ? `: ${expData.name}` : ""
  //   }`;
  // }

  return {
    link,
    label: expData.name,
    componentLabel: expData,
  };
}
