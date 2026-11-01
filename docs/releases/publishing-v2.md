# Publish npm when a GitHub release is published

Publishing a stable GitHub release triggers `.github/workflows/npm-release.yml`.
The workflow builds the tagged source, validates it and publishes every public
package in dependency order with npm's `latest` tag and provenance. Browser
extensions still have a separate store submission process.

## Make a release

1. Start from current master and run `pnpm release:version 2.0.1` (replace the
   version with the intended release). Lerna updates the synchronized public
   package versions, `lerna.json` and pnpm lockfile without committing or tagging.
2. Commit the version changes and release notes through a pull request. All CI
   gates, including the six e2e groups, must pass. Merge the PR into master.
3. On GitHub, create a release with a tag matching the version, such as
   `v2.0.1`, pointing to that merged commit. Add the release notes and publish it.
4. Watch **Publish npm release** in Actions. It first runs `pnpm build`,
   `pnpm check` (including release tests), `pnpm package-contract`, and pnpm pack.
   A separate job publishes the verified artifacts using OIDC authentication.
5. Confirm the workflow succeeds and npm shows the intended versions. Store
   submission and the announcement of extension availability are separate.

Draft releases do not publish npm packages. Prereleases are deliberately ignored
by this workflow; they need a separate channel such as `next` before enabling
prerelease automation. The workflow checks that the tag matches `lerna.json` and
all public package versions, and that the tagged source is merged into master.

The first v2.0.0 release was published manually before this workflow existed.
It will not be republished. The automation applies to future tagged releases
that include the workflow.

## Configure npm trusted publishing

The workflow has no npm publishing secret. Configure this trusted publisher on
**each** of the eight npm packages:

- GitHub repository: `infi-pc/locatorjs`.
- Workflow filename: `npm-release.yml` (no directory prefix).
- Environment: leave empty; the workflow does not use a deployment environment.
- Permission: allow direct `npm publish`.

The packages are `@locator/shared`, `@locator/styled-system`, `@locator/ui`,
`@locator/runtime`, `@locator/babel-jsx`, `@locator/webpack-loader`,
`@locator/dev-config` and `locatorjs`. Their repository metadata must match this
repository. New packages must be published once manually before adding trust.

Use the package settings on npmjs.com or a compatible npm CLI (11.15.0 or later):

```bash
npm trust list @locator/runtime
npm trust github @locator/runtime --repo infi-pc/locatorjs --file npm-release.yml --allow-publish --yes
```

Repeat for all eight packages. Inspect existing configurations before adding
anything; do not replace an unrelated publisher. npm may require browser 2FA.
The workflow installs npm 11.21.0 because Node 22's bundled npm is too old for
OIDC publishing; Node itself remains pinned in `.nvmrc`.

A newly created trusted publisher must complete its first successful publish
within **two days**, otherwise npm requires recreating it. Configure publishers
close to the first automatic release. A dry run or a run that only skips existing
versions does not validate a new publisher. See
[npm's trusted publisher documentation](https://docs.npmjs.com/trusted-publishers/)
and [the npm trust command](https://docs.npmjs.com/cli/v11/commands/npm-trust/).

## Test without publishing

Run **Publish npm release** manually from Actions on the intended branch. Manual
runs execute the build, checks, packaging and `npm publish --dry-run`; the real
publish job only runs for a published stable release. No npm package is changed.
Dry runs bypass npm's client-side duplicate-version check so the current
published version can be exercised. Real publishes always check existing
versions and never use that bypass.

The same packaging steps can be exercised locally after `pnpm build`:

```bash
pnpm check
pnpm package-contract
pnpm release:pack
pnpm release:dry-run
```

The artifacts and their integrity plan are written to `.context/npm-release/`.
The workflow saves them as an Actions artifact before granting the separate
publish job OIDC access. Release jobs do not restore dependency or build caches.

## Recover a partial publication

Re-run the failed workflow in Actions. It checks **every** package before making
any new publishes, skips a version only if its registry integrity matches the
prepared tarball, and fails on a conflicting version. It also refuses to move
`latest` to an older stable version. Existing versions cannot be overwritten.

If a rebuilt tarball differs from an already published version, investigate the
build difference and prepare a new version rather than unpublishing packages.
`pnpm publishPackages` now invokes the guarded CI publisher; it no longer starts
an interactive Lerna version bump.
