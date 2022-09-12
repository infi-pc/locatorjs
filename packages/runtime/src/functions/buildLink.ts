import { linkTemplateUrl } from "./linkTemplateUrl";
import { evalTemplate } from "./evalTemplate";
import { LinkProps, Source } from "../types/types";
import { Targets } from "@locator/shared";
import { getOptions, setOptions } from "./optionsStore";

let internalProjectPath: string | null = null;
export function setInternalProjectPath(projectPath: string) {
  internalProjectPath = projectPath;
}

export function setLocalStorageProjectPath(projectPath: string) {
  setOptions({ projectPath });
}

export function getSavedProjectPath() {
  return getOptions().projectPath || internalProjectPath;
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
      projectPath: source.projectPath || "",
      line: source.lineNumber,
      column: source.columnNumber || 0,
    },
    targets
  );
}
