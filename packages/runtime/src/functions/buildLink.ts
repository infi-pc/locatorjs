import { resolveSourcePath, strictConfig } from "@locator/shared";
import type { LinkProps } from "../types/types";
import { evalTemplate } from "./evalTemplate";
import type { OptionsStore } from "./optionsStore";

export function buildLink(
  linkProps: LinkProps,
  options: Pick<OptionsStore, "effective">,
  editor: strictConfig.SelectedEditor
): string {
  const effective = options.effective();
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
    ...(effective.tmuxSession ? { tmuxSession: effective.tmuxSession } : {}),
  };

  let evaluated = evalTemplate(editor.template, params);
  evaluated = stripUnresolvedQueryParams(evaluated);
  return effective.replacePath
    ? strictConfig.rewritePath(effective.replacePath, evaluated)
    : evaluated;
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
