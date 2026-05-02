import type { Targets } from "@locator/shared";
import type { LinkProps, Source } from "../types/types";
import { evalTemplate } from "./evalTemplate";
import { linkTemplateUrl } from "./linkTemplateUrl";
import type { OptionsStore } from "./optionsStore";
import { transformPath } from "./transformPath";

export function buildLink(
  linkProps: LinkProps,
  targets: Targets,
  options: OptionsStore,
  localLinkTypeOrTemplate?: string
): string {
  const effective = options.effective();
  const tmuxSession = effective.tmuxSession;
  const savedProjectPath = effective.projectPath || linkProps.projectPath;

  // Handle Turbopack [project]/ prefix
  let resolvedFilePath = linkProps.filePath;
  if (resolvedFilePath.startsWith("[project]/") && savedProjectPath) {
    const relativePath = resolvedFilePath.slice("[project]/".length);
    resolvedFilePath = savedProjectPath.endsWith("/")
      ? savedProjectPath + relativePath
      : savedProjectPath + "/" + relativePath;
  }

  const params = {
    filePath: resolvedFilePath,
    projectPath: savedProjectPath,
    line: String(linkProps.line),
    column: String(linkProps.column),
    linePlusOne: String(linkProps.line + 1),
    columnPlusOne: String(linkProps.column + 1),
    lineMinusOne: String(linkProps.line - 1),
    columnMinusOne: String(linkProps.column - 1),
    ...(tmuxSession ? { tmuxSession } : {}),
  };

  const template = linkTemplateUrl(targets, options, localLinkTypeOrTemplate);
  const replacePathObj = effective.replacePath;
  let evaluated = evalTemplate(template, params);

  if (replacePathObj) {
    evaluated = transformPath(
      evaluated,
      replacePathObj.from,
      replacePathObj.to
    );
  }
  return evaluated;
}

export function buildLinkFromSource(
  source: Source,
  targets: Targets,
  options: OptionsStore
): string {
  return buildLink(
    {
      filePath: source.fileName,
      projectPath: source.projectPath || "",
      line: source.lineNumber,
      column: source.columnNumber || 0,
    },
    targets,
    options
  );
}
