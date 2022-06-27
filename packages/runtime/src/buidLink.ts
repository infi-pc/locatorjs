import { linkTemplateUrl } from "./linkTemplateUrl";
import { evalTemplate } from "./evalTemplate";

export function buidLink(filePath: string, projectPath: string, loc: any) {
  const params = {
    filePath,
    projectPath,
    line: loc.start.line,
    column: loc.start.column + 1,
  };
  return evalTemplate(linkTemplateUrl(), params);
}
