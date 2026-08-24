import {
  hasEditorOverride,
  resolveBindingTarget,
  type BindingAction,
  type EditorSelection,
} from "./layeredOptions";
import type { Targets } from "./targets";

/** Pure action copy, kept outside the icon/component graph. */
export function actionLabel(
  action: BindingAction,
  targets?: Targets,
  editor?: EditorSelection
): string {
  switch (action.kind) {
    case "open-editor": {
      if (!hasEditorOverride(action)) return "Open in editor";
      if (targets) {
        const target = resolveBindingTarget(action, targets, editor);
        if (target.kind === "template") return "Open custom editor link";
        return `Open in ${
          targets[target.id]?.label ?? (target.id || "editor")
        }`;
      }
      if (action.targetTemplate) return "Open custom editor link";
      return `Open in ${action.targetId}`;
    }
    case "copy-path":
      return "Copy path";
    case "copy-prompt":
      return "Copy AI prompt";
    case "open-prompt":
      return `Open prompt in ${
        action.app === "cursor" ? "Cursor" : "Windsurf"
      }`;
    case "show-tree":
      return "Tree view";
    case "show-parents":
      return "Parents";
  }
}
