import {
  Targets,
  primaryEditorBinding,
  resolveBindingTarget,
} from "@locator/shared";
import { OptionsStore } from "./optionsStore";

export const getLinkTypeOrTemplate = (
  targets: Targets,
  options: OptionsStore,
  localLinkTypeOrTemplate?: string
) => {
  if (localLinkTypeOrTemplate) return localLinkTypeOrTemplate;
  const binding = primaryEditorBinding(options.effective().bindings);
  if (binding?.action.kind === "open-editor") {
    const resolved = resolveBindingTarget(binding.action, targets);
    return resolved.kind === "template" ? resolved.url : resolved.id;
  }
  return targets.vscode ? "vscode" : Object.entries(targets)[0]?.[0] ?? "";
};

export function linkTemplateUrl(
  targets: Targets,
  options: OptionsStore,
  localLinkTypeOrTemplate?: string
): string {
  if (localLinkTypeOrTemplate) {
    const target = targets[localLinkTypeOrTemplate];
    return target ? target.url : localLinkTypeOrTemplate;
  }
  const binding = primaryEditorBinding(options.effective().bindings);
  if (binding?.action.kind === "open-editor") {
    return resolveBindingTarget(binding.action, targets).url;
  }
  if (targets.vscode) return targets.vscode.url;
  return Object.entries(targets)[0]?.[1].url ?? "";
}
