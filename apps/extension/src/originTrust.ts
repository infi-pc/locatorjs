import browser from './browser';
import { canonicalHttpOrigin, trustedOriginKey } from './originAccess';

export async function grantOrigin(origin: string): Promise<void> {
  const canonical = canonicalHttpOrigin(origin);
  if (!canonical) throw new Error('Only an HTTP(S) origin can be approved.');
  await browser.storage.local.set({ [trustedOriginKey(canonical)]: true });
}

export async function revokeOrigin(origin: string): Promise<void> {
  const canonical = canonicalHttpOrigin(origin);
  if (!canonical) throw new Error('Only an HTTP(S) origin can be revoked.');
  await browser.storage.local.remove(trustedOriginKey(canonical));
}
