const ACTIVE_CONTENT_SCHEMES = new Set([
  "blob",
  "data",
  "javascript",
  "vbscript",
]);

/** A custom editor/application URL must have a non-active static scheme. */
export function isSafeTargetTemplate(template: string): boolean {
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(template.trim())?.[1];
  return Boolean(scheme && !ACTIVE_CONTENT_SCHEMES.has(scheme.toLowerCase()));
}
