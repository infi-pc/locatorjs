import {
  needsEditorSetup,
  resolveBindingTarget,
  resolveEditorTarget,
  type ResolvedTarget,
  type Targets,
} from "@locator/shared";
import { OptionsStore } from "./optionsStore";

/**
 * Where source links open for surfaces that are not tied to a single binding
 * (the tree panel, the parents menu, the welcome screen preview). They follow
 * the global Editor setting rather than guessing from the bindings list.
 */
export function resolveEditorLink(
  targets: Targets,
  options: OptionsStore,
  localLinkTypeOrTemplate?: string
): ResolvedTarget {
  if (localLinkTypeOrTemplate) {
    const target = targets[localLinkTypeOrTemplate];
    return target
      ? {
          kind: "targetId",
          id: localLinkTypeOrTemplate,
          url: target.url,
        }
      : { kind: "template", url: localLinkTypeOrTemplate };
  }
  return resolveEditorTarget(options.effective().editor, targets);
}

/**
 * True when we would be guessing the destination. Callers ask the user to pick
 * an editor instead of opening a link that goes nowhere.
 */
export function editorNeedsSetup(
  targets: Targets,
  options: OptionsStore,
  localLinkTypeOrTemplate?: string
): boolean {
  if (!localLinkTypeOrTemplate && options.provenance?.().editor === "default") {
    return true;
  }
  return needsEditorSetup(
    resolveEditorLink(targets, options, localLinkTypeOrTemplate)
  );
}

export function linkTemplateUrl(
  targets: Targets,
  options: OptionsStore,
  localLinkTypeOrTemplate?: string
): string {
  return resolveEditorLink(targets, options, localLinkTypeOrTemplate).url;
}

/** Resolves the destination of a single `open-editor` action. */
export function actionTargetUrl(
  action: { targetId?: string; targetTemplate?: string },
  targets: Targets,
  options: OptionsStore
): ResolvedTarget {
  return resolveBindingTarget(
    { kind: "open-editor", ...action },
    targets,
    options.effective().editor
  );
}
