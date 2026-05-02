import { LocatorOptions, Target } from "@locator/shared";
import { AdapterId } from "./consts";
import { initRuntime } from "./initRuntime";
import { isExtension } from "./functions/isExtension";
import { setTeamTargets, updateTeamLayer } from "./functions/teamLayerStore";
export * from "./adapters/jsx/runtimeStore";

if (typeof window !== "undefined" && isExtension()) {
  setTimeout(() => initRuntime({}), 0);
}

export const MAX_ZINDEX = 2147483647;

export function setup({
  adapter,
  targets,
  projectPath,
  showIntro,
}: {
  adapter?: AdapterId;
  targets?: { [k: string]: Target | string };
  projectPath?: string;
  showIntro?: boolean;
} = {}) {
  const teamOptions: Partial<LocatorOptions> = {};
  if (adapter) teamOptions.adapterId = adapter;
  if (projectPath !== undefined) teamOptions.projectPath = projectPath;
  if (showIntro !== undefined) teamOptions.showIntro = showIntro;
  updateTeamLayer(teamOptions);

  if (targets) {
    const normalised: { [k: string]: Target } = {};
    for (const [key, value] of Object.entries(targets)) {
      normalised[key] =
        typeof value === "string" ? { url: value, label: key } : value;
    }
    setTeamTargets(normalised);
  }

  setTimeout(() => initRuntime({ adapter, targets, showIntro }), 0);
}

export default setup;
