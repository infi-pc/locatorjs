# Publish LocatorJS v2

Prepare npm packages and both browser extensions from the same reviewed commit.
Keep the version at 2.0.0: the merged branch already contains the version bump.
Do not run bare `lerna publish`, which starts another versioning flow.

## Build and check

Use the Node version in `.nvmrc` and pnpm from `package.json`:

```bash
nvm use
corepack pnpm install --frozen-lockfile
corepack pnpm build
corepack pnpm check
corepack pnpm package-contract
corepack pnpm --dir apps/extension release
corepack pnpm --dir apps/extension exec web-ext lint --source-dir build/production_firefox
```

Ensure subprocesses also resolve the pinned pnpm version. With Corepack,
`corepack enable` installs the shims. The package contract builds the packages,
checks their actual packed manifests, and installs them into an isolated consumer
to test browser bundling, native ESM/CommonJS imports and TypeScript declarations.

Confirm the build, check, package-contract, firefox-build and all six e2e group
jobs pass for the release commit. The merged e2e report job alone is not a gate.

## Prepare npm artifacts

From the repository root, set an absolute output directory and use pnpm to
rewrite workspace dependency ranges:

```bash
RELEASE_DIR="$PWD/.context/release/v2"
mkdir -p "$RELEASE_DIR/npm"
corepack pnpm --recursive --filter './packages/*' --workspace-concurrency=1 exec pnpm pack --pack-destination "$RELEASE_DIR/npm"
```

There are eight public packages: `@locator/shared`, `@locator/styled-system`,
`@locator/ui`, `@locator/runtime`, `@locator/babel-jsx`,
`@locator/webpack-loader`, `@locator/dev-config` and `locatorjs`.
`@locator/styled-system` is a new npm package. It must be public because runtime
and UI depend on it. Pack with pnpm; `npm pack` on a source package leaves
`workspace:` dependencies unresolved.

## Publish npm artifacts

Restore npm authentication with `npm login`, then check `npm whoami` and publishing
rights for the `@locator` scope and `locatorjs`. Account permissions and any 2FA
challenge must be verified with a valid login before publishing.

Publish the prepared tarballs in dependency order. These commands publish to
`latest`; run them only when the release is approved:

```bash
npm publish "$RELEASE_DIR/npm/locator-shared-2.0.0.tgz" --access public --tag latest
npm publish "$RELEASE_DIR/npm/locator-styled-system-2.0.0.tgz" --access public --tag latest
npm publish "$RELEASE_DIR/npm/locator-ui-2.0.0.tgz" --access public --tag latest
npm publish "$RELEASE_DIR/npm/locator-runtime-2.0.0.tgz" --access public --tag latest
npm publish "$RELEASE_DIR/npm/locator-babel-jsx-2.0.0.tgz" --access public --tag latest
npm publish "$RELEASE_DIR/npm/locator-webpack-loader-2.0.0.tgz" --access public --tag latest
npm publish "$RELEASE_DIR/npm/locator-dev-config-2.0.0.tgz" --access public --tag latest
npm publish "$RELEASE_DIR/npm/locatorjs-2.0.0.tgz" --access public --tag latest
```

Confirm each registry version and dist-tag after publishing. If a command fails,
check what reached the registry and continue only with unpublished packages;
published npm versions cannot be overwritten. Install the packages into a fresh
consumer without local overrides before announcing the release.

## Submit browser extensions

The release script builds dependencies and writes both unsigned submission ZIPs:

- Chrome: `apps/extension/build/chrome.zip`.
- Firefox: `apps/extension/build/firefox.zip`.

Both manifests must declare 2.0.0. Upload to the existing
[Chrome listing](https://chromewebstore.google.com/detail/locatorjs/npbfdllefekhdplbkdigpncggmojpefi)
and [Firefox listing](https://addons.mozilla.org/en-US/firefox/addon/locatorjs/).
Dashboard access and submission status need a publisher session; building ZIPs
does not submit them.

Firefox's current MV2 manifest does not include an ID. When updating through the
AMO API, supply the existing add-on ID; do not create a separate listing. See
[Mozilla's add-on ID guidance](https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/).
Its new data-consent manifest requirement currently applies to new add-ons,
not updates to listings created before November 3, 2025; confirm this remains
true at submission time in the
[Mozilla guidance](https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/).

Include source code and build instructions for Firefox review if requested:
use the exact release commit, `pnpm install --frozen-lockfile`, then
`pnpm --dir apps/extension release:firefox` under the pinned Node/pnpm versions.
Review the linter output alongside the source rather than treating warnings as
proof of a vulnerability or as approval from the store.

## Tag and announce

Create the `v2.0.0` tag on the reviewed release commit and create a GitHub release
using [the release notes](v2.0.0.md). Attach the extension ZIPs, source archive and
artifact checksums. State any pending store review clearly; do not announce an
extension as available until its listing serves 2.0.0.
