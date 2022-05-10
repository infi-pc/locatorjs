import gte from 'semver/functions/gte';

export const MIN_SUPPORTED_VERSION = '16.9.0';
export const BUNDLE_TYPE_PROD = 0;
export const BUNDLE_TYPE_DEV = 1;

export function isValidRenderer({
  rendererPackageName,
  version,
  bundleType,
}: {
  rendererPackageName?: string;
  version?: string;
  bundleType?: number;
}) {
  if (
    rendererPackageName !== 'react-dom' ||
    typeof version !== 'string' ||
    !/^\d+\.\d+\.\d+(-\S+)?$/.test(version) ||
    !gte(version, MIN_SUPPORTED_VERSION)
  ) {
    console.warn(
      `[locator-js] Unsupported React renderer (only react-dom v${MIN_SUPPORTED_VERSION}+ is supported)`,
      {
        renderer: rendererPackageName || 'unknown',
        version: version || 'unknown',
      }
    );

    return false;
  }

  if (bundleType !== BUNDLE_TYPE_DEV) {
    console.warn(
      `[locator-js] Unsupported React renderer, only bundle type ${BUNDLE_TYPE_DEV} (development) is supported but ${bundleType} (${
        bundleType === BUNDLE_TYPE_PROD ? 'production' : 'unknown'
      }) is found`
    );

    return false;
  }

  return true;
}
