/* eslint-disable solid/reactivity */
import { linkTemplateUrl } from "./linkTemplateUrl";
import { evalTemplate } from "./evalTemplate";
import { LinkProps, Source } from "./types";
import { Targets } from "@locator/shared";

export function buildLink(linkProps: LinkProps, targets: Targets): string {
  const params = {
    filePath: linkProps.filePath,
    projectPath: linkProps.projectPath,
    line: String(linkProps.line),
    column: String(linkProps.column),
  };
  return evalTemplate(linkTemplateUrl(targets), params);
}

export function buildLinkFromSource(source: Source, targets: Targets): string {
  return buildLink(
    {
      filePath: source.fileName,
      projectPath: "",
      line: source.lineNumber,
      column: source.columnNumber || 0,
    },
    targets
  );
}
