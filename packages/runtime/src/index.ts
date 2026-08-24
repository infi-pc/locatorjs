import { LocatorOptions, Target } from "@locator/shared";
import { AdapterId } from "./consts";
import { initRuntime } from "./initRuntime";
import { isExtension } from "./functions/isExtension";
import { setTeamTargets, updateTeamLayer } from "./functions/teamLayerStore";
import { installShadowRootTracking } from "./functions/shadowRoots";
import { readEffectiveRuntimeOptions } from "./functions/runtimeOptionsSnapshot";
export * from "./adapters/jsx/runtimeStore";
export { MAX_ZINDEX } from "./consts";

if (typeof window !== "undefined" && isExtension()) {
  setTimeout(() => initRuntime(), 0);
}

export type SetupOptions = LocatorOptions & {
  adapter?: AdapterId;
  targets?: { [k: string]: Target | string };
};

export function setup({ adapter, targets, ...options }: SetupOptions = {}) {
  const teamOptions: Partial<LocatorOptions> = { ...options };
  if (adapter !== undefined) teamOptions.adapterId = adapter;

  if (targets) {
    const normalised: { [k: string]: Target } = {};
    for (const [key, value] of Object.entries(targets)) {
      normalised[key] =
        typeof value === "string" ? { url: value, label: key } : value;
    }
    setTeamTargets(normalised);

    // Replacing the targets map is itself a choice of destination. The built-in
    // default is `vscode`, which such a map does not contain, so without this
    // every link resolves to `unknown-id` and the runtime asks the user to pick
    // an editor the app has already picked for them. Recording it on the team
    // layer keeps provenance honest and lets user layers still override it.
    const [firstId] = Object.keys(normalised);
    if (firstId && !teamOptions.editor) {
      teamOptions.editor = { targetId: firstId };
    }
  }

  updateTeamLayer(teamOptions);

  if (!readEffectiveRuntimeOptions().disabled) installShadowRootTracking();

  setTimeout(() => initRuntime(), 0);
}

export default setup;
