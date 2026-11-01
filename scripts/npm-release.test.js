const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const {
  releasePackages,
  assertPublishEvent,
  alreadyPublished,
  assertNoDowngrade,
  readPlan,
} = require("./npm-release");

function fixture(t, manifests) {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "locator-release-test-")
  );
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  fs.mkdirSync(path.join(directory, "packages"));
  fs.writeFileSync(path.join(directory, "lerna.json"), '{"version":"2.1.0"}');
  manifests.forEach((manifest, index) => {
    const location = path.join(directory, "packages", String(index));
    fs.mkdirSync(location);
    fs.writeFileSync(
      path.join(location, "package.json"),
      JSON.stringify({
        version: "2.1.0",
        repository: { url: "https://github.com/infi-pc/locatorjs" },
        ...manifest,
      })
    );
  });
  return directory;
}

test("release ordering follows runtime dependencies and excludes private apps", (t) => {
  const directory = fixture(t, [
    { name: "locatorjs", dependencies: { "@locator/runtime": "workspace:^" } },
    {
      name: "@locator/runtime",
      dependencies: { "@locator/ui": "workspace:^" },
    },
    {
      name: "@locator/ui",
      optionalDependencies: { "@locator/shared": "workspace:^" },
    },
    { name: "@locator/shared" },
    { name: "private-tools", private: true },
  ]);
  assert.deepEqual(
    releasePackages(directory, "v2.1.0").packages.map(
      (pkg) => pkg.manifest.name
    ),
    ["@locator/shared", "@locator/ui", "@locator/runtime", "locatorjs"]
  );
  for (const tag of ["v2.0.0", "2.1.0", "v2.1.0-beta.1", "v02.1.0"]) {
    assert.throws(() => releasePackages(directory, tag));
  }
});

test("release rejects a private runtime dependency, cycles and missing internal packages", (t) => {
  for (const manifests of [
    [
      { name: "a", dependencies: { b: "workspace:^" } },
      { name: "b", private: true },
    ],
    [
      { name: "a", dependencies: { b: "workspace:^" } },
      { name: "b", dependencies: { a: "workspace:^" } },
    ],
    [{ name: "a", dependencies: { "@locator/missing": "workspace:^" } }],
    [{ name: "a", version: "2.0.0" }],
    [{ name: "a", repository: undefined }],
  ]) {
    assert.throws(() => releasePackages(fixture(t, manifests), "v2.1.0"));
  }
});

test("only a newly pushed version tag in this repository can publish", () => {
  const env = {
    GITHUB_ACTIONS: "true",
    GITHUB_REPOSITORY: "infi-pc/locatorjs",
    GITHUB_EVENT_NAME: "push",
    GITHUB_REF: "refs/tags/v2.1.0",
  };
  const event = {
    ref: "refs/tags/v2.1.0",
    created: true,
    deleted: false,
    forced: false,
  };
  assert.doesNotThrow(() => assertPublishEvent(env, event, "v2.1.0"));
  for (const change of [
    { GITHUB_ACTIONS: "false" },
    { GITHUB_REPOSITORY: "someone/locatorjs" },
    { GITHUB_EVENT_NAME: "workflow_dispatch" },
    { GITHUB_EVENT_NAME: "release" },
    { GITHUB_REF: "refs/heads/master" },
  ])
    assert.throws(() =>
      assertPublishEvent({ ...env, ...change }, event, "v2.1.0")
    );
  for (const change of [
    { created: false },
    { deleted: true },
    { forced: true },
    { ref: "refs/tags/v2.0.0" },
    { ref: "refs/heads/master" },
  ]) {
    assert.throws(() =>
      assertPublishEvent(env, { ...event, ...change }, "v2.1.0")
    );
  }
  assert.throws(() => assertPublishEvent(env, {}, "v2.1.0"));
});

test("retries skip only byte-identical existing versions", () => {
  const entry = {
    name: "@locator/runtime",
    version: "2.1.0",
    integrity: "sha512-prepared",
  };
  assert.equal(alreadyPublished(entry, null), false);
  assert.equal(
    alreadyPublished(entry, { dist: { integrity: entry.integrity } }),
    true
  );
  assert.throws(() =>
    alreadyPublished(entry, { dist: { integrity: "sha512-other" } })
  );
  assert.throws(() => alreadyPublished(entry, {}));
});

test("an older release cannot replace a newer latest version", () => {
  for (const latest of ["3.0.0", "2.2.0", "2.1.1"]) {
    assert.throws(() => assertNoDowngrade("2.1.0", latest));
  }
  for (const latest of [undefined, "1.9.9", "2.0.9", "2.1.0"]) {
    assert.doesNotThrow(() => assertNoDowngrade("2.1.0", latest));
  }
});

test("downloaded artifacts must match the release plan and expected package set", (t) => {
  const directory = fixture(t, [{ name: "@locator/runtime" }]);
  const release = releasePackages(directory, "v2.1.0");
  const filename = "locator-runtime-2.1.0.tgz";
  const tarball = path.join(directory, filename);
  fs.writeFileSync(tarball, "prepared bytes");
  const entry = {
    name: "@locator/runtime",
    version: "2.1.0",
    filename,
    integrity: `sha512-${crypto
      .createHash("sha512")
      .update(fs.readFileSync(tarball))
      .digest("base64")}`,
  };
  const plan = { tag: "v2.1.0", packages: [entry] };
  function write(value) {
    fs.writeFileSync(path.join(directory, "plan.json"), JSON.stringify(value));
  }
  write(plan);
  assert.deepEqual(readPlan("v2.1.0", release, directory), [entry]);
  for (const value of [
    { ...plan, tag: "v2.0.0" },
    { ...plan, packages: [] },
    { ...plan, packages: [{ ...entry, filename: "../other.tgz" }] },
    { ...plan, packages: [{ ...entry, name: "other" }] },
  ]) {
    write(value);
    assert.throws(() => readPlan("v2.1.0", release, directory));
  }
  write(plan);
  fs.writeFileSync(tarball, "changed bytes");
  assert.throws(() => readPlan("v2.1.0", release, directory));
});
