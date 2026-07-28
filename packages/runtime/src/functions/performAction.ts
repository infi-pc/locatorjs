import {
  resolveFilePath,
  type BindingAction,
  type Targets,
} from "@locator/shared";
import type { FullElementInfo } from "../adapters/adapterApi";
import { HREF_TARGET } from "../consts";
import type { OptionsStore } from "./optionsStore";
import { buildLink } from "./buildLink";
import { buildPrompt, buildPromptDeeplink } from "./buildPrompt";
import { writeClipboard } from "./writeClipboard";

export type ActionContext = {
  element: FullElementInfo;
  targets: Targets;
  options: OptionsStore;
  showTree: (element: HTMLElement) => void;
  showParents: (element: HTMLElement, x: number, y: number) => void;
  parentsPosition?: { x: number; y: number };
};

export async function performAction(
  action: BindingAction,
  context: ActionContext
): Promise<boolean> {
  const { element, options, targets } = context;
  const link = element.thisElement.link;

  switch (action.kind) {
    case "open-editor": {
      if (!link) return false;
      const destination = buildLink(
        link,
        targets,
        options,
        action.targetTemplate ?? action.targetId
      );
      window.open(destination, options.effective().hrefTarget || HREF_TARGET);
      return true;
    }
    case "copy-path": {
      if (!link) return false;
      const projectPath = options.effective().projectPath || link.projectPath;
      const path = resolveFilePath(link.filePath, projectPath);
      return writeClipboard(`${path}:${link.line}:${link.column}`);
    }
    case "copy-prompt":
      return writeClipboard(
        buildPrompt(element, options.effective(), action.template)
      );
    case "open-prompt": {
      const prompt = buildPrompt(element, options.effective(), action.template);
      window.open(buildPromptDeeplink(action.app, prompt), "_self");
      return true;
    }
    case "show-tree":
      context.showTree(element.htmlElement);
      return true;
    case "show-parents": {
      const position = context.parentsPosition ?? {
        x: element.thisElement.box.x + 2,
        y: element.thisElement.box.y + 20,
      };
      context.showParents(element.htmlElement, position.x, position.y);
      return true;
    }
  }
}
