import type { BindingAction, Targets } from "@locator/shared";
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
  _targets?: Targets,
  defaultEditorId?: string
) {
  switch (action.kind) {
    case "open-editor":
      return editorIconFor(
        action.targetId ??
          (action.targetTemplate ? "custom" : defaultEditorId ?? "default")
      );
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

export function actionLabel(action: BindingAction, targets?: Targets): string {
  switch (action.kind) {
    case "open-editor":
      return action.targetId
        ? `Open in ${targets?.[action.targetId]?.label ?? action.targetId}`
        : "Open in editor";
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
