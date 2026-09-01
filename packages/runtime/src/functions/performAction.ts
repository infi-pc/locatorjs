import { resolveSourcePath, strictConfig } from "@locator/shared";
import type { FullElementInfo } from "../adapters/adapterApi";
import type { LinkProps } from "../types/types";
import { buildLink } from "./buildLink";
import { buildPrompt, buildPromptDeeplink } from "./buildPrompt";
import type { OptionsStore } from "./optionsStore";
import { writeClipboard } from "./writeClipboard";

export type ActionContext = {
  element: FullElementInfo;
  options: Pick<OptionsStore, "effective" | "targetRegistry">;
  showTree: (element: HTMLElement) => void;
  showParents: (element: HTMLElement, x: number, y: number) => void;
  parentsPosition?: { x: number; y: number };
  requestEditorSetup?: (link: LinkProps) => void;
};

export async function performAction(
  action: strictConfig.ConfiguredAction,
  context: ActionContext
): Promise<boolean> {
  const { element, options } = context;
  const link = element.thisElement.link;

  switch (action.kind) {
    case "open-editor": {
      if (!link) return false;
      const editor = strictConfig.resolveActionEditor(
        action,
        options.effective().editor,
        options.targetRegistry()
      );
      if (editor.kind === "needs-selection") {
        context.requestEditorSetup?.(link);
        return false;
      }
      window.open(
        buildLink(link, options, editor),
        options.effective().hrefTarget
      );
      return true;
    }
    case "copy-path": {
      if (!link) return false;
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
