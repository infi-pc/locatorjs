import browser from './browser';

export type OriginAccess =
  | { origin: null; reason: 'unavailable' }
  | {
      origin: string;
      reason: 'localhost' | 'approved' | 'approval-required';
    };

export function canonicalHttpOrigin(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function trustedOriginKey(origin: string): string {
  return `trustedOrigin:${origin}`;
}

export async function getOriginAccess(origin: unknown): Promise<OriginAccess> {
  const canonical = canonicalHttpOrigin(origin);
  if (!canonical) return { origin: null, reason: 'unavailable' };
  const hostname = new URL(canonical).hostname;
  if (hostname === 'localhost')
    return { origin: canonical, reason: 'localhost' };
  const stored = await browser.storage.local.get(trustedOriginKey(canonical));
  return stored[trustedOriginKey(canonical)] === true
    ? { origin: canonical, reason: 'approved' }
    : { origin: canonical, reason: 'approval-required' };
}

export function canSharePrivateSettings(access: OriginAccess): boolean {
  return access.reason === 'localhost' || access.reason === 'approved';
}
