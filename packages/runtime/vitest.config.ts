import { defineConfig } from "vitest/config";

/**
 * Node 25 turned Web Storage on by default, so `localStorage` exists on the
 * Node global. Vitest only copies a jsdom key onto the test global when the key
 * is absent there or is in its own allowlist — and the storages are in neither
 * — so jsdom's working `Storage` stayed shadowed by Node's, which returns
 * `undefined` unless `--localstorage-file` is passed. Every test touching
 * `localStorage` then failed. See vitest-dev/vitest#8757.
 *
 * Turning Node's implementation off hands the globals back to jsdom. The flag
 * only exists where Web Storage does: Node 22 (what CI runs) rejects it with
 * "bad option" and does not need it, since it leaves the globals alone. So probe
 * the Node running vitest rather than passing the flag unconditionally.
 */
const shadowsJsdomStorage = "localStorage" in globalThis;

export default defineConfig({
  resolve: {
    conditions: ["browser", "development"],
  },
  test: {
    poolOptions: {
      forks: { execArgv: shadowsJsdomStorage ? ["--no-webstorage"] : [] },
    },
  },
});
