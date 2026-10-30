import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";
import { activeGroup, appsFor, describeGroup } from "./e2e-groups";
import { apps, appOrigin } from "./tests/apps";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * `E2E_GROUP` selects one named group of specs — see e2e-groups.ts, which also
 * asserts on load that the groups, the spec files on disk and ci.yml's matrix
 * all agree. Setting it restricts `testMatch` to that group's files, trims
 * `webServer` to the apps those files navigate to, and names the blob report
 * after the group so the reports still merge.
 *
 * Unset means the whole suite and every server, exactly as before, which is
 * what `pnpm e2e`, `e2e-headed` and `e2e-extension` all rely on.
 *
 * An env var rather than a Playwright project per group because `webServer` is
 * config-wide: a `--project=solid-*` split would still boot all ten apps, and
 * not booting them is most of the point.
 */
const group = activeGroup();
// Main process only: Playwright re-evaluates this config in every worker, and
// one copy of the line above the webServer output is the useful number.
if (group && process.env.TEST_WORKER_INDEX === undefined) {
  console.info(describeGroup(group));
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: "./tests",
  /**
   * Only when a group is active; left undefined otherwise so the default glob
   * still collects tests/extensions for `pnpm e2e-extension`.
   *
   * A pattern here is a suffix match against the absolute file path, not a
   * path relative to `testDir`: Playwright prefixes any pattern that lacks one
   * with a recursive wildcard. Patterns also intersect with a path passed on
   * the command line rather than fighting it, so the `./tests/libs` in
   * package.json's scripts keeps working. A pattern matching nothing is a
   * "no tests found" failure, which is the backstop for a typo.
   */
  testMatch: group?.specs,
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /**
   * Retry on CI only.
   *
   * These retries are currently masking a real defect, so don't read a green
   * run as "no flakes". `basics.spec.ts` "solid" fails on first attempt in all
   * three browsers on roughly every run, then passes on retry in ~5s. Two
   * distinct failure snapshots exist for the same assertion:
   *
   *   1. the solid app is fully rendered with no LocatorJS UI at all
   *   2. the LocatorJS UI *is* in the accessibility tree, Settings button
   *      included, but under an extra wrapper node — and getByRole still
   *      reports "element(s) not found"
   *
   * (2) rules out slowness: the element exists and is still unreachable, which
   * points at the runtime's shadow-root mount rather than timing. getByRole
   * does not pierce closed shadow roots. Sharding only changed the timing
   * enough to expose it; the serial pre-sharding run reported 0 flaky. Named
   * groups change the timing again — basics.spec.ts now runs alone in its own
   * job — so the rate may move either way, and one green run proves nothing.
   *
   * Two things were tried and did not help, so don't repeat them: switching
   * webServer from `port` to `url`, and a globalSetup that loaded every app in
   * a real browser and waited for the same Settings button (reverted in
   * 4047541). The fix belongs in the runtime's mount, or in the specs using a
   * locator that reaches into the shadow root deliberately.
   */
  retries: process.env.CI ? 2 : 0,
  /**
   * One worker per job on CI. Not for isolation — that already holds without
   * it. Playwright gives every test a fresh BrowserContext, and the only thing
   * the runtime persists is localStorage (`LOCATOR_USER_CONFIG` and
   * `LOCATOR_UI_STATE`), so
   * settings.spec.ts gets the empty store it depends on and tree-parents.spec.ts
   * seeds its own through addInitScript. The dev servers hold no per-test state.
   *
   * It is for headroom: a runner has 4 vCPUs, and the `basics` group alone puts
   * seven dev servers on them. The solid flake below is timing-sensitive, so
   * raising this is a change to make on its own and measure, not a freebie —
   * a per-group `workers` in e2e-groups.ts is the obvious place for it.
   */
  workers: process.env.CI ? 1 : undefined,
  /**
   * On CI: `github` annotates the failing lines directly in the PR, `list`
   * puts the failure in the job log (previously the html reporter was the
   * only one, so the log said nothing and you had to download an artifact to
   * learn which test broke), and `blob` is what makes merging possible.
   *
   * The blob file name has to be explicit now. It used to come for free from
   * `--shard`, which appends the shard number; with named groups and no shard
   * every job would write `blob-report/report.zip` and the `merge-multiple`
   * download in the report job would keep only one of them. Note that
   * dropping `merge-multiple` is not the alternative fix — merge-reports reads
   * its input directory non-recursively, so one zip per subdirectory reads as
   * no reports at all.
   */
  reporter: process.env.CI
    ? [
        ["github"],
        ["list"],
        ["blob", { fileName: `report-${group?.name ?? "all"}.zip` }],
      ]
    : [["html", { open: "never" }]],
  /** Carried per-machine into the merged report, so a result names its job. */
  tag: group && `@${group.name}`,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },

    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
    },

    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
      },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //   },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: {
    //     ...devices['iPhone 12'],
    //   },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: {
    //     channel: 'msedge',
    //   },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: {
    //     channel: 'chrome',
    //   },
    // },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  // outputDir: 'test-results/',

  /**
   * Every server the active group needs, in one place.
   *
   * This used to list only the four Next.js apps, leaving the rest to be
   * started by `pnpm dev` / `pnpm test-apps:dev` and waited on by a bash
   * port-loop in the CI workflow. That split meant three owners of server
   * startup and two port lists that had already drifted apart. Playwright
   * boots these in parallel, waits for each URL itself, and pipes their
   * output, so a server that dies during startup reports its own error
   * instead of surfacing as an anonymous 60s timeout.
   *
   * `reuseExistingServer` is off on CI (nothing is running, so a stray
   * listener means something is wrong) and on locally, so an already-running
   * `pnpm dev` is reused rather than fought over.
   *
   * `url` rather than `port` on purpose: `port` only waits for a TCP listener,
   * which a dev server opens before it can actually serve. That difference is
   * not theoretical — `port` silently reused a local apps/web server that was
   * returning HTTP 500 from a stale .next, where `url` refused it and said so.
   *
   * Note this is a readiness signal, not a warm-up. It does not fix the
   * basics.spec.ts "solid" flake; see the comment on `retries`.
   *
   * Which servers depends on `E2E_GROUP`: a group boots only the apps its
   * specs navigate to, which e2e-groups.ts checks against those specs' own
   * source before anything starts. With no group this is every app, derived as
   * the union of every group's — which is how vite-svelte-clean-project stays
   * in the list, since tests/extensions needs it and tests/libs does not.
   *
   * Package names and ports live in tests/apps.ts, next to the URL map the
   * specs import, so this package has one port list rather than two. They also
   * live in test-apps/<app>/package.json; see scripts/dev-ports.sh for the
   * shared source.
   */
  webServer: appsFor(group).map((key) => ({
    command: `pnpm --filter ${apps[key].pkg} dev`,
    url: appOrigin(key),
    reuseExistingServer: !process.env.CI,
    // The Next apps cold-compile on first request; be generous.
    timeout: 120_000,
    stdout: "pipe" as const,
    stderr: "pipe" as const,
  })),
};

export default config;
