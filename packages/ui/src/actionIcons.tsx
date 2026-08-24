import {
  resolveBindingTarget,
  type BindingAction,
  type EditorSelection,
  type Targets,
} from "@locator/shared";
export { actionLabel } from "@locator/shared";
import {
  Clipboard,
  FileCode2,
  ListTree,
  Network,
  Send,
  Sparkles,
} from "lucide-solid";
import { editorIconFor } from "./editorIcons";
import type { SelectItem } from "./Select";

const actionSelectItemByKind = {
  "open-editor": {
    label: "Open in editor",
    icon: () => actionTypeIconFor("open-editor"),
  },
  "copy-path": {
    label: "Copy path",
    icon: () => actionTypeIconFor("copy-path"),
  },
  "copy-prompt": {
    label: "Copy AI prompt",
    icon: () => actionTypeIconFor("copy-prompt"),
  },
  "open-prompt": {
    label: "Open prompt in…",
    icon: () => actionTypeIconFor("open-prompt"),
  },
  "show-tree": {
    label: "Tree view",
    icon: () => actionTypeIconFor("show-tree"),
  },
  "show-parents": {
    label: "Parents",
    icon: () => actionTypeIconFor("show-parents"),
  },
} satisfies Record<BindingAction["kind"], Omit<SelectItem, "value">>;

export const actionSelectItems: SelectItem[] = Object.entries(
  actionSelectItemByKind
).map(([value, item]) => ({ value, ...item }));

export function actionTypeIconFor(kind: BindingAction["kind"]) {
  switch (kind) {
    case "open-editor":
      return <FileCode2 size={16} />;
    case "copy-path":
      return <Clipboard size={16} />;
    case "copy-prompt":
      return <Sparkles size={16} />;
    case "open-prompt":
      return <Send size={16} />;
    case "show-tree":
      return <Network size={16} />;
    case "show-parents":
      return <ListTree size={16} />;
  }
}

export function actionIconFor(
  action: BindingAction,
  targets?: Targets,
  editor?: EditorSelection
) {
  switch (action.kind) {
    case "open-editor": {
      if (action.targetTemplate) return editorIconFor("custom");
      if (targets) {
        const target = resolveBindingTarget(action, targets, editor);
        if (target.kind === "template") return editorIconFor("custom");
        return editorIconFor(target.id || "default");
      }
      return editorIconFor(action.targetId ?? editor?.targetId ?? "default");
    }
    case "copy-path":
      return actionTypeIconFor(action.kind);
    case "copy-prompt":
      return actionTypeIconFor(action.kind);
    case "open-prompt":
      return editorIconFor(action.app);
    case "show-tree":
      return actionTypeIconFor(action.kind);
    case "show-parents":
      return actionTypeIconFor(action.kind);
    default:
      return <FileCode2 size={16} />;
  }
}
