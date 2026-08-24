/**
 * Node 25+ exposes Web Storage on the process global. That shadows jsdom's
 * working implementation, so Vitest forks must disable Node's copy. Node 22
 * rejects the flag and does not expose the global, hence the feature probe.
 */
function noWebStoragePoolOptions() {
  return {
    forks: {
      execArgv: "localStorage" in globalThis ? ["--no-webstorage"] : [],
    },
  };
}

module.exports = { noWebStoragePoolOptions };
