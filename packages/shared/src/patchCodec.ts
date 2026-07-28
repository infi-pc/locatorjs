import type { LocatorOptions } from "./layeredOptions";

export type SerializedPatch = {
  patch: Record<string, unknown>;
  unset: (keyof LocatorOptions)[];
};

export function serializePatch(
  patch: Partial<LocatorOptions>
): SerializedPatch {
  const serialized: SerializedPatch = { patch: {}, unset: [] };
  for (const key of Object.keys(patch) as (keyof LocatorOptions)[]) {
    const value = patch[key];
    if (value === undefined) {
      serialized.unset.push(key);
    } else {
      serialized.patch[key] = value;
    }
  }
  return serialized;
}

export function deserializePatch(
  patch: Record<string, unknown>,
  unset?: unknown
): Partial<LocatorOptions> {
  const next = { ...patch } as Partial<LocatorOptions>;
  if (!Array.isArray(unset)) return next;

  for (const key of unset) {
    if (typeof key === "string") {
      next[key as keyof LocatorOptions] = undefined;
    }
  }
  return next;
}
