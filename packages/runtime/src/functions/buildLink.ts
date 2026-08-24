import { resolveSourcePath, type Targets } from "@locator/shared";
import type { LinkProps } from "../types/types";
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

  // Every shipped template interpolates `${projectPath}${filePath}`, so the two
  // have to be split apart here — handing over a path that already carries the
  // root would bake it into the URL twice.
  const source = resolveSourcePath(
    linkProps.filePath,
    effective.projectPath || linkProps.projectPath
  );

  const params = {
    filePath: source.filePath,
    projectPath: source.projectPath,
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
  evaluated = stripUnresolvedQueryParams(evaluated);

  if (replacePathObj) {
    evaluated = transformPath(
      evaluated,
      replacePathObj.from,
      replacePathObj.to
    );
  }
  return evaluated;
}

function stripUnresolvedQueryParams(url: string): string {
  const hashIndex = url.indexOf("#");
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const queryIndex = withoutHash.indexOf("?");
  if (queryIndex < 0) return url;

  const base = withoutHash.slice(0, queryIndex);
  const query = withoutHash.slice(queryIndex + 1);
  const resolvedParams = query
    .split("&")
    .filter((param) => param && !/\$\{[^}]+\}/.test(param));

  return `${base}${
    resolvedParams.length ? `?${resolvedParams.join("&")}` : ""
  }${hash}`;
}
