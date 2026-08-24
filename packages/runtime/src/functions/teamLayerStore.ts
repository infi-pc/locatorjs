import { createSignal } from "solid-js";
import type { LocatorOptions, Targets } from "@locator/shared";

const [teamLayerSignal, setTeamLayerSignal] = createSignal<
  LocatorOptions | undefined
>(undefined);
const [teamTargetsSignal, setTeamTargetsSignal] = createSignal<
  Targets | undefined
>(undefined);

export function updateTeamLayer(patch: Partial<LocatorOptions>) {
  const current = teamLayerSignal() ?? {};
  setTeamLayerSignal({ ...current, ...patch });
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

export function __resetTeamLayerForTesting() {
  setTeamLayerSignal(undefined);
  setTeamTargetsSignal(undefined);
}
