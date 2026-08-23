# AGENTS.md

LocatorJS: click a component in the browser, land on its source in your editor.
A pnpm + Turborepo monorepo shipping a browser extension, a runtime library, a
babel plugin, and the marketing site.

## Verify your work with one command

```bash
pnpm check
```

Runs formatting, dependency-version consistency, unused-code checks, source
duplication checks, lint, typecheck and unit tests across all 13 packages. It
uses `--continue=always`, so Turbo reports **every** failing package gate in one
run rather than stopping at the first, and `--output-logs=errors-only`, so the
Turbo output is only failures.

Fix what it reports and re-run until it is green. Two shortcuts:

```bash
pnpm check:fix   # prettier + dependency-version autofix
pnpm format      # formatting only
```

`pnpm check` is exactly what CI's `check` job runs, so green locally means green
in CI. Scope it to one package while iterating:

```bash
pnpm turbo run lint ts test --filter=@locator/runtime
```

Never claim a check passed that you did not run.

## Commands

| Command                      | What                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `pnpm build`                 | Build all packages and apps (turbo, cached)            |
| `pnpm check`                 | Every gate. Use this.                                  |
| `pnpm dev`                   | All dev servers (sources `scripts/dev-ports.sh` first) |
| `pnpm e2e`                   | Playwright suite. Starts its own servers — see below.  |
| `pnpm ui:lab`                | Component workbench on 3344                            |
| `pnpm ts` / `pnpm typecheck` | Typecheck only (same thing)                            |
| `pnpm lint` / `pnpm test`    | Individual gates                                       |
| `pnpm knip`                  | Unused files and dependencies                          |
| `pnpm dup`                   | Source duplication budget                              |
| `pnpm clean`                 | Remove node_modules, dist, .turbo, .next               |

Node version is pinned in `.nvmrc` (22). Don't hardcode it anywhere else.

## Don't start a dev server yourself

One is usually already running, and a second either fights over the port or
serves a _different Conductor workspace_. Ask before starting `pnpm dev`.
One-off commands that run and exit — `pnpm build`, `pnpm check`, `pnpm -C
apps/extension build` — are always fine.

`pnpm e2e` is the exception: Playwright's `webServer` array owns starting every
app it needs, waits for each, and reuses anything already listening when not on
CI. Do not start servers by hand before running it.

## Ports

Every port derives from one base via `scripts/dev-ports.sh`, so parallel
workspaces don't collide:

```bash
PORT=45000 . ./scripts/dev-ports.sh && pnpm dev
```

Each consumer reads its variable with the historical port as the default, so
**not** sourcing the script keeps the original numbers. Defaults: web 3342,
vite-react 3343, ui-lab 3344, solid 3345, preact 3346, svelte 3347,
react-clean 3348, svelte-clean 3349, vue 3350, next-14 3351, next-16 3352,
next-16-turbopack 3353.

If you add an app, add its variable to `scripts/dev-ports.sh` **and** to
`turbo.json`'s `globalEnv` — otherwise turbo omits it from cache keys and will
hand you a build made against a different port. Give its dev server
`--strictPort` too: without it vite silently moves to the next free port, which
is the next app's slot, and the collision cascades through the block.

## Layout

**Packages** — `runtime` (injected into the page; draws the overlays),
`shared` (pure helpers, bindings, editor-target resolution), `ui` (Solid
components), `styled-system` (Panda CSS tokens/theme, mostly generated),
`babel-jsx` (adds source attributes to JSX), `webpack-loader` (wraps the babel
plugin), `react-devtools-hook` (installs the devtools global hook),
`dev-config` (shared eslint presets + tsconfig bases), `locatorjs` (published
stub, no source).

**Apps** — `extension` (the browser extension, Solid + webpack),
`web` (locatorjs.com, Next.js), `ui-lab` (component workbench, private),
`playwright` (e2e suite).

**test-apps/** — 10 fixture apps across React/Solid/Preact/Svelte/Vue/Next that
the e2e suite drives. Excluded from `pnpm build` and `pnpm check`.

## Rules, and what enforces each

- **Don't add a `console.log`.** `no-console` allows only `error`, `info` and
  `warn` (`packages/dev-config/eslint-base-preset.js`). Caught by `pnpm lint`.
- **Don't add `@ts-ignore`.** `@typescript-eslint/ban-ts-comment` bans it; use
  `@ts-expect-error` _with a description_. `@ts-expect-error` fails the build if
  the error it claims to suppress doesn't exist, which is the point. Caught by
  `pnpm lint` and `pnpm ts`.
- **Every `eslint-disable` needs a reason** after `--`. Not machine-enforced
  yet; treat it as required anyway.
- **A new package needs `lint` and `ts` scripts.** Turbo silently no-ops on a
  missing script, so a package without them is invisible to CI rather than
  passing it. This is how coverage previously sat at 4/13 for lint. Confirm with
  `pnpm turbo run lint --dry=json`.
- **Keep dependency versions identical across packages.** Enforced by
  `pnpm dependency-versions` inside `pnpm check`. `prettier` is currently
  exempted (see Known rough edges).
- **Don't edit generated output**: `packages/styled-system/dist` (Panda),
  `apps/web/next-env.d.ts`, `apps/extension/build`.

## Tests

Unit tests are colocated `*.test.ts(x)` next to the source, run by **vitest**:
`runtime` (22 files), `ui` (11), `shared` (5), `extension` (4).
`packages/babel-jsx` is the one **jest** package, with fixture snapshots under
`tests/fixtures/`.

E2E lives in `apps/playwright/tests/libs` (168 tests, 3 browsers), driven
against the `test-apps/` fixtures.

CI runs it as six **named groups** — `adapters`, `tree`, `embedding`,
`settings`, `bindings`, `next` — not as anonymous shards.
`apps/playwright/e2e-groups.ts` defines which specs and which dev servers each
one gets, so a job boots only the apps its specs navigate to. `adapters` is the
one that needs seven servers: it varies the framework rather than the depth, one
shallow test per app over `packages/runtime/src/adapters`. Run one locally with
`E2E_GROUP=<name> pnpm exec playwright test` from `apps/playwright`; leave the
variable unset and you get the whole suite and all ten servers, as before.

**A new spec file must be added to a group.** Otherwise CI silently stops
running it. That is checked, not trusted: `e2e-groups.ts` throws at config load
if a spec belongs to no group, if a group is missing an app its specs visit, or
if the group list and `ci.yml`'s matrix disagree. Renaming a group means editing
both, and the check will tell you so.

`apps/playwright/tests/extensions` needs a real extension build and `--headed`,
so it is **not** run by `pnpm e2e` and does not run in CI. It has a group
(`extension`, marked `ci: false`) only so `vite-svelte-clean-project` has a
stated reason to exist.

## Known rough edges

Things that will waste your time if you rediscover them:

- **`playwright install` needs the Node version in `.nvmrc`.** On Node 26 the
  download finishes in seconds and then extraction deadlocks at ~1 MB with the
  process at 0% CPU — no error, no timeout, just a hang, and killing it leaves a
  `~/Library/Caches/ms-playwright/__dirlock` that makes every later install
  abort with "An active lockfile is found". Playwright 1.62 fixed this; 1.59 and
  earlier hang. If you hit it on an older branch, `rm -rf` the `__dirlock` and
  re-run under Node 22. A partially-extracted browser dir also has to go, or
  you get `Executable doesn't exist at .../chromium_headless_shell-<rev>` at
  test time.
- **`pnpm e2e` on default ports reuses another workspace's servers.**
  `reuseExistingServer` is on locally, so if a parallel Conductor workspace has
  `pnpm dev` up, Playwright silently tests _that_ checkout. Give the run its own
  block first: `PORT=45000 . ./scripts/dev-ports.sh && pnpm e2e`.
- **`--no-webstorage` in three vitest configs is load-bearing.** Node 25+ turned
  on Web Storage, which shadows jsdom's `localStorage` and breaks every test
  touching it (vitest-dev/vitest#8757). The configs probe the running Node
  rather than assuming a version, because Node 22 rejects the flag outright.
  Don't "simplify" it to an unconditional flag.
- **Prettier is split across majors** — 2.8.8 at root and in `apps/extension`,
  3.8.3 in `packages/babel-jsx` — and there are three formatter entry points
  with disagreeing options. `dependency-versions` exempts `prettier` until this
  is unified, since unifying reformats the repo.
- **`.npmrc`'s `minimum-release-age` is inert** on the pinned pnpm 8.7.5; it
  needs pnpm >= 10.16.
- **`packages/locatorjs` is a published stub** whose `main` points at a `dist`
  nothing builds.
- **Renaming an e2e group renames a CI check.** Required status checks are
  typed into GitHub's branch protection by hand, so a group rename leaves PRs
  waiting forever on a check that will never report again. Update the required
  check names in the same change.
- **`.context/` is gitignored** agent scratch space. Put screenshots and repro
  scripts there, not in the repo proper.

## What CI checks

`.github/workflows/ci.yml`, on PRs and pushes to **master** (not `main`):

- **build** → populates the turbo cache
- **check** → `pnpm check`; all non-e2e gates in one job
- **e2e (adapters | tree | embedding | settings | bindings | next)** →
  Playwright, each group booting only the dev servers its own specs use
- **e2e report** → merges the six blob reports into one HTML report. Not a gate:
  `merge-reports` exits 0 whatever the tests did, so this job is green on a red
  suite. The `e2e (<group>)` jobs are the checks.

Failures are annotated inline on the PR by Playwright's `github` reporter, so
you usually don't need to download an artifact.
