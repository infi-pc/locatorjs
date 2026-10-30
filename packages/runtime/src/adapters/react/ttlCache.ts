/**
 * A cache that forgets.
 *
 * The resolver caches whole fetched JS bundles and parsed source maps by URL.
 * Both were unbounded and never invalidated -- `clearTurbopackCache` and
 * `clearSourceMapCache` had no callers anywhere -- and dev chunk URLs are
 * stable across HMR, so one unresolvable click retained the full text of every
 * script on the page for the lifetime of the tab, and a rebuild kept resolving
 * to pre-edit line numbers.
 *
 * A short TTL fixes both without needing an HMR hook to be right: this is a
 * dev tool, so a few seconds of staleness costs nothing, and an entry cap
 * bounds the memory a big app can pin.
 */
export type TtlCache<T> = {
  get(key: string): T | undefined;
  has(key: string): boolean;
  set(key: string, value: T): void;
  clear(): void;
  readonly size: number;
};

export function createTtlCache<T>(
  ttlMs: number,
  maxEntries: number
): TtlCache<T> {
  const entries = new Map<string, { value: T; expiresAt: number }>();

  const isLive = (entry: { expiresAt: number } | undefined) =>
    entry !== undefined && entry.expiresAt > Date.now();

  return {
    get(key) {
      const entry = entries.get(key);
      if (!isLive(entry)) {
        entries.delete(key);
        return undefined;
      }
      return entry!.value;
    },
    has(key) {
      const entry = entries.get(key);
      if (!isLive(entry)) {
        entries.delete(key);
        return false;
      }
      return true;
    },
    set(key, value) {
      // Refresh insertion order so the oldest key is the one evicted.
      entries.delete(key);
      entries.set(key, { value, expiresAt: Date.now() + ttlMs });
      while (entries.size > maxEntries) {
        const oldest = entries.keys().next();
        if (oldest.done) break;
        entries.delete(oldest.value);
      }
    },
    clear() {
      entries.clear();
    },
    get size() {
      return entries.size;
    },
  };
}
