import { linkTemplateUrl } from "./linkTemplateUrl";
import { evalTemplate } from "./evalTemplate";
import { Source } from "./types";
import { SourceLocation } from "@locator/shared";

export function buidLink(
  filePath: string,
  projectPath: string,
  loc: SourceLocation
): string {
  const params = {
    filePath,
    projectPath,
    line: String(loc.start.line),
    column: String(loc.start.column + 1),
  };
  return evalTemplate(linkTemplateUrl(), params);
}

export function buildLinkFromSource(source: Source): string {
  return buidLink(source.fileName, "", {
    start: {
      column: source.columnNumber || 0,
      line: source.lineNumber || 0,
    },
    end: {
      column: source.columnNumber || 0,
      line: source.lineNumber || 0,
    },
  });
}
