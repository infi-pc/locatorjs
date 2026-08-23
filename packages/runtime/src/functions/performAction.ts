import {
  needsEditorSetup,
  resolveBindingTarget,
  resolveSourcePath,
  type BindingAction,
  type Targets,
} from "@locator/shared";
import type { FullElementInfo } from "../adapters/adapterApi";
import { HREF_TARGET } from "../consts";
import type { LinkProps } from "../types/types";
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
  /**
   * Called instead of navigating when no editor is configured, so the click
   * asks the user to pick one rather than opening a link that goes nowhere.
   */
  requestEditorSetup?: (link: LinkProps) => void;
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
      const target = resolveBindingTarget(
        action,
        targets,
        options.effective().editor
      );
      if (needsEditorSetup(target)) {
        context.requestEditorSetup?.(link);
        return false;
      }
      const destination = buildLink(
        link,
        targets,
        options,
        target.kind === "template" ? target.url : target.id
      );
      window.open(destination, options.effective().hrefTarget || HREF_TARGET);
      return true;
    }
    case "copy-path": {
      if (!link) return false;
      // The copied path is pasted into a terminal or another editor, so it has
      // to be the same complete path the editor link resolves to.
      const { absolute } = resolveSourcePath(
        link.filePath,
        options.effective().projectPath || link.projectPath
      );
      return writeClipboard(`${absolute}:${link.line}:${link.column}`);
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
