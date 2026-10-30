import type { BindingAction, TargetViewMap } from "./config";

/** Pure action copy, kept outside the icon/component graph. */
export function actionLabel(
  action: BindingAction,
  targets?: TargetViewMap
): string {
  switch (action.kind) {
    case "open-editor": {
      const destination = action.destination;
      if (!destination) return "Open in editor";
      if (destination.kind === "template") return "Open custom editor link";
      return `Open in ${targets?.[destination.id]?.label ?? destination.id}`;
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
