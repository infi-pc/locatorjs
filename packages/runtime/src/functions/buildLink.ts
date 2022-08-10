/* eslint-disable solid/reactivity */
import { linkTemplateUrl } from "./linkTemplateUrl";
import { evalTemplate } from "./evalTemplate";
import { LinkProps, Source } from "../types/types";
import { Targets } from "@locator/shared";

let internalProjectPath: string | null = null;
export function setInternalProjectPath(projectPath: string) {
  internalProjectPath = projectPath;
}

export function setLocalStorageProjectPath(projectPath: string) {
  localStorage.setItem("LOCATOR_PROJECT_PATH", projectPath);
}

export function cleanLocalStorageProjectPath() {
  localStorage.removeItem("LOCATOR_PROJECT_PATH");
}

export function getSavedProjectPath() {
  return localStorage.getItem("LOCATOR_PROJECT_PATH") || internalProjectPath;
}

export function buildLink(
  linkProps: LinkProps,
  targets: Targets,
  localLinkTypeOrTemplate?: string
): string {
  const params = {
    filePath: linkProps.filePath,
    projectPath: getSavedProjectPath() || linkProps.projectPath,
    line: String(linkProps.line),
    column: String(linkProps.column),
  };
  return evalTemplate(
    linkTemplateUrl(targets, localLinkTypeOrTemplate),
    params
  );
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
