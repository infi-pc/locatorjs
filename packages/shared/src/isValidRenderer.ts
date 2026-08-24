export const MIN_SUPPORTED_VERSION = "16.9.0";
export const BUNDLE_TYPE_PROD = 0;
export const BUNDLE_TYPE_DEV = 1;

export function isValidRenderer(
  {
    rendererPackageName,
    version,
    bundleType,
  }: {
    rendererPackageName?: string;
    version?: string;
    bundleType?: number;
  },
  reportError?: (message: string) => void
): boolean {
  if (
    rendererPackageName !== "react-dom" ||
    typeof version !== "string" ||
    !isSupportedVersion(version)
  ) {
    reportError &&
      reportError(
        `Unsupported React renderer (only react-dom v${MIN_SUPPORTED_VERSION}+ is supported). Renderer: ${
          rendererPackageName || "unknown"
        }, Version: ${version || "unknown"}`
      );

    return false;
  }

  if (bundleType !== BUNDLE_TYPE_DEV) {
    reportError &&
      reportError(
        `Unsupported React renderer, only bundle type ${BUNDLE_TYPE_DEV} (development) is supported but ${bundleType} (${
          bundleType === BUNDLE_TYPE_PROD ? "production" : "unknown"
        }) is found`
      );

    return false;
  }

  return true;
}

function isSupportedVersion(version: string): boolean {
  const match = /^(\d+)\.(\d+)\.(\d+)(-\S+)?$/.exec(version);
  if (!match) return false;
  const parts = match.slice(1, 4).map(Number);
  const minimum = [16, 9, 0];
  for (let index = 0; index < minimum.length; index += 1) {
    const part = parts[index];
    const minimumPart = minimum[index];
    if (part === undefined || minimumPart === undefined) return false;
    if (part > minimumPart) return true;
    if (part < minimumPart) return false;
  }
  // A prerelease of the minimum is lower than the stable minimum.
  return match[4] === undefined;
}
