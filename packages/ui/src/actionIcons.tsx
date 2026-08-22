import {
  hasEditorOverride,
  resolveBindingTarget,
  type BindingAction,
  type EditorSelection,
  type Targets,
} from "@locator/shared";
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

export const actionSelectItems: SelectItem[] = [
  {
    value: "open-editor",
    label: "Open in editor",
    icon: () => actionTypeIconFor("open-editor"),
  },
  {
    value: "copy-path",
    label: "Copy path",
    icon: () => actionTypeIconFor("copy-path"),
  },
  {
    value: "copy-prompt",
    label: "Copy AI prompt",
    icon: () => actionTypeIconFor("copy-prompt"),
  },
  {
    value: "open-prompt",
    label: "Open AI prompt in…",
    icon: () => actionTypeIconFor("open-prompt"),
  },
  {
    value: "show-tree",
    label: "Tree view",
    icon: () => actionTypeIconFor("show-tree"),
  },
  {
    value: "show-parents",
    label: "Parents",
    icon: () => actionTypeIconFor("show-parents"),
  },
];

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

export function actionLabel(
  action: BindingAction,
  targets?: Targets,
  editor?: EditorSelection
): string {
  switch (action.kind) {
    case "open-editor": {
      // Actions without an override follow the global Editor setting, so the
      // label stays generic; only a pinned destination names an editor.
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
