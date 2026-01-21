import type { Targets } from "@locator/shared";
import type { LinkProps, Source } from "../types/types";
import { evalTemplate } from "./evalTemplate";
import { linkTemplateUrl } from "./linkTemplateUrl";
import type { OptionsStore } from "./optionsStore";
import { transformPath } from "./transformPath";

let internalProjectPath: string | null = null;
export function setInternalProjectPath(projectPath: string) {
  internalProjectPath = projectPath;
}

export function getSavedProjectPath(options: OptionsStore) {
  return options.getOptions().projectPath || internalProjectPath;
}

export function buildLink(
  linkProps: LinkProps,
  targets: Targets,
  options: OptionsStore,
  localLinkTypeOrTemplate?: string
): string {
  const savedProjectPath = getSavedProjectPath(options) || linkProps.projectPath;

  // 处理 Turbopack 的 [project]/ 前缀
  // 如果 filePath 以 [project]/ 开头，用 projectPath 替换
  let resolvedFilePath = linkProps.filePath;
  if (resolvedFilePath.startsWith("[project]/") && savedProjectPath) {
    // 移除 [project]/ 前缀，拼接 projectPath
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
  };

  const template = linkTemplateUrl(targets, options, localLinkTypeOrTemplate);
  const replacePathObj = options.getOptions().replacePath;
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
