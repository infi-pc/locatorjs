export function assetBaseUrlFromClientUrl(clientUrl: string | undefined) {
  if (!clientUrl) return undefined;

  try {
    return new URL('.', clientUrl).href;
  } catch {
    return undefined;
  }
}
