import { Targets, resolveTarget } from "@locator/shared";
import { OptionsStore } from "./optionsStore";

export const getLinkTypeOrTemplate = (
  targets: Targets,
  options: OptionsStore,
  localLinkTypeOrTemplate?: string
) => {
  if (localLinkTypeOrTemplate) return localLinkTypeOrTemplate;
  const effective = options.effective();
  if (effective.targetTemplate) return effective.targetTemplate;
  if (effective.targetId && targets[effective.targetId]) {
    return effective.targetId;
  }
  return Object.entries(targets)[0]![0];
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
  const resolved = resolveTarget(options.effective(), targets);
  return resolved.url;
}
