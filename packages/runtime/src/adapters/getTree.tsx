import { getAdapter } from "./adapterSelection";

export function getTree(target: HTMLElement, adapterId?: string) {
  return getAdapter(adapterId)?.getTree?.(target) ?? null;
}
