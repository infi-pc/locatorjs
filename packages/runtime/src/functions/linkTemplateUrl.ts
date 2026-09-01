import { strictConfig } from "@locator/shared";
import type { OptionsStore } from "./optionsStore";

/** Global editor state for link surfaces not owned by an individual action. */
export function resolveEditorLink(
  options: Pick<OptionsStore, "effective">
): strictConfig.EffectiveEditor {
  return options.effective().editor;
}

export function editorNeedsSetup(
  options: Pick<OptionsStore, "effective">
): boolean {
  return resolveEditorLink(options).kind === "needs-selection";
}

export function actionEditor(
  action: Extract<strictConfig.ConfiguredAction, { kind: "open-editor" }>,
  options: Pick<OptionsStore, "effective" | "targetRegistry">
): strictConfig.EffectiveEditor {
  return strictConfig.resolveActionEditor(
    action,
    options.effective().editor,
    options.targetRegistry()
  );
}
