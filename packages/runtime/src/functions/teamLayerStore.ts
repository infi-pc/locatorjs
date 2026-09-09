import { strictConfig } from "@locator/shared";

export type TeamConfigSnapshot = strictConfig.CompiledSetup;

const initialSnapshot = Object.freeze({
  layer: strictConfig.EMPTY_LAYER,
  targets: strictConfig.BUILT_IN_TARGETS,
});

let teamConfig: TeamConfigSnapshot = initialSnapshot;
const listeners = new Set<() => void>();

export function replaceTeamConfig(snapshot: TeamConfigSnapshot) {
  teamConfig = snapshot;
  for (const listener of [...listeners]) listener();
}

export function getTeamConfig(): TeamConfigSnapshot {
  return teamConfig;
}

export function listenToTeamConfigChanges(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function __resetTeamLayerForTesting() {
  replaceTeamConfig(initialSnapshot);
}
