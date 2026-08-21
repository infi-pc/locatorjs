import {
  DEFAULT_PROMPT_TEMPLATE,
  resolveFilePath,
  type LocatorOptions,
  type PromptApp,
} from "@locator/shared";
import type { FullElementInfo } from "../adapters/adapterApi";
import { getParentsPaths } from "../adapters/getParentsPath";
import { evalTemplate } from "./evalTemplate";

const MAX_HTML_LENGTH = 1500;
const MAX_COMPONENTS = 8;
const MAX_DEEPLINK_LENGTH = 8000;

export function buildPrompt(
  element: FullElementInfo,
  effective: LocatorOptions,
  template?: string
): string {
  const link = element.thisElement.link;
  const projectPath = effective.projectPath || link?.projectPath || "";
  const filePath = link ? resolveFilePath(link.filePath, projectPath) : "";
  const componentLabels = element.componentsLabels
    .map((item) => item.label)
    .filter(Boolean);
  const parentLabels = getParentsPaths(element.htmlElement)
    .map((item) => item.title)
    .filter(Boolean);
  const componentTree = [...parentLabels, ...componentLabels]
    .filter((item, index, all) => all.indexOf(item) === index)
    .slice(-MAX_COMPONENTS)
    .join(" > ");

  return evalTemplate(template ?? DEFAULT_PROMPT_TEMPLATE, {
    filePath,
    projectPath,
    line: link ? String(link.line) : "",
    column: link ? String(link.column) : "",
    componentName: componentLabels[0] ?? "",
    componentTree,
    htmlSnippet: cleanHtmlSnippet(element.htmlElement),
    elementLabel: element.thisElement.label,
  });
}

export function buildPromptDeeplink(app: PromptApp, prompt: string): string {
  const prefix =
    app === "cursor"
      ? "cursor://anysphere.cursor-deeplink/prompt?text="
      : "windsurf://cascade/newChat?prompt=";
  const value = prompt;
  let result = prefix + encodeURIComponent(value);
  if (result.length <= MAX_DEEPLINK_LENGTH) return result;

  // Keep URL handling deterministic and safely under Cursor's documented
  // limit, including percent-encoding expansion.
  let low = 0;
  let high = value.length;
  const suffix = encodeURIComponent("…");
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (
      (prefix + encodeURIComponent(value.slice(0, mid))).length <=
      MAX_DEEPLINK_LENGTH - suffix.length
    ) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  result = prefix + encodeURIComponent(value.slice(0, low)) + suffix;
  return result;
}

function cleanHtmlSnippet(element: HTMLElement): string {
  const clone = element.cloneNode(true) as HTMLElement;
  for (const node of [clone, ...Array.from(clone.querySelectorAll("*"))]) {
    for (const attribute of Array.from(node.attributes)) {
      if (attribute.name.startsWith("data-locatorjs-")) {
        node.removeAttribute(attribute.name);
      }
    }
  }
  const html = clone.outerHTML;
  return html.length > MAX_HTML_LENGTH
    ? `${html.slice(0, MAX_HTML_LENGTH)}…`
    : html;
}
