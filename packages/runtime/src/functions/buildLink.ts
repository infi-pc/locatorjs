import { linkTemplateUrl } from "./linkTemplateUrl";
import { evalTemplate } from "./evalTemplate";
import { LinkProps, Source } from "../types/types";
import { Targets } from "@locator/shared";
import { OptionsStore } from "./optionsStore";

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
  const params = {
    filePath: linkProps.filePath,
    projectPath: getSavedProjectPath(options) || linkProps.projectPath,
    line: String(linkProps.line),
    column: String(linkProps.column),
  };
  return evalTemplate(
    linkTemplateUrl(targets, options, localLinkTypeOrTemplate),
    params
  );
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
