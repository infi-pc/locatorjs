import { createSignal } from "solid-js";
import type { LocatorOptions, Targets } from "@locator/shared";

const [teamLayerSignal, setTeamLayerSignal] = createSignal<
  LocatorOptions | undefined
>(undefined);
const [teamTargetsSignal, setTeamTargetsSignal] = createSignal<
  Targets | undefined
>(undefined);
const [hasSetupSignal, setHasSetupSignal] = createSignal(false);

export function updateTeamLayer(patch: Partial<LocatorOptions>) {
  const current = teamLayerSignal() ?? {};
  setTeamLayerSignal({ ...current, ...patch });
  setHasSetupSignal(true);
}

export function setTeamTargets(targets: Targets | undefined) {
  setTeamTargetsSignal(targets);
}

export function getTeamLayerSignal() {
  return teamLayerSignal;
}

export function getTeamTargetsSignal() {
  return teamTargetsSignal;
}

export function hasLibrarySetup() {
  return hasSetupSignal();
}

export function __resetTeamLayerForTesting() {
  setTeamLayerSignal(undefined);
  setTeamTargetsSignal(undefined);
  setHasSetupSignal(false);
}
