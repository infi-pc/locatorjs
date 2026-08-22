import * as fs from "fs";
import * as path from "path";
import {
  appKeys,
  appOrigin,
  appServing,
  type AppKey,
  type PageKey,
} from "./tests/apps";

/**
 * Which specs run together, and which dev servers that needs.
 *
 * This file exists so CI can say `e2e (embedding)` instead of
 * `e2e (shard 2/3)`. A group decides two things:
 *
 *   - Which specs run, so a red check names the area that broke rather than an
 *     arbitrary third of the suite. `--shard` splits individual tests, so every
 *     shard was a mix drawn from all six spec files.
 *   - Which dev servers boot. Five of these six need a single app, where every
 *     shard used to start all ten and wait ~48s for the Next ones.
 *
 * Groups are one-per-file today, but `specs` is a list on purpose: a small new
 * spec belongs in an existing group, not in a seventh CI job paying another
 * ~80s of checkout, install and browser download.
 *
 * It lives at the package root rather than under tests/ because it is
 * configuration, not a test helper: playwright.config.ts is the only thing that
 * should import it, and nothing under tests/ does. Playwright re-evaluates the
 * config in every worker process, so the checks below run a handful of times
 * per run — they are a few small file reads, which is affordable, but keep them
 * that way.
 */
export type Group = {
  /** Spec files, relative to tests/. Used verbatim as the config's testMatch. */
  specs: string[];
  /** The servers these specs need, and the only ones the job will boot. */
  apps: AppKey[];
  /** Left out of the CI matrix. */
  ci?: false;
};

export const groups = {
  basics: {
    specs: ["libs/basics.spec.ts"],
    apps: ["web", "react", "preact", "solid", "svelte", "reactClean", "vue"],
  },
  tree: { specs: ["libs/tree-parents.spec.ts"], apps: ["react"] },
  embedding: { specs: ["libs/embedding.spec.ts"], apps: ["react"] },
  settings: { specs: ["libs/settings.spec.ts"], apps: ["solid"] },
  bindings: { specs: ["libs/binding-actions.spec.ts"], apps: ["solid"] },
  next: {
    specs: ["libs/next16.spec.ts"],
    apps: ["next16", "next16Turbopack"],
  },
  /**
   * Not in CI: tests/extensions needs a real extension build and --headed. It
   * is declared anyway so vite-svelte-clean-project has a stated reason to be
   * in the default server list — nothing under tests/libs touches it — and so
   * `E2E_GROUP=extension` is a thing you can run.
   */
  extension: {
    specs: ["extensions/extension.spec.ts"],
    apps: ["reactClean", "svelteClean"],
    ci: false,
  },
} satisfies Record<string, Group>;

export type GroupName = keyof typeof groups;

const groupNames = Object.keys(groups) as GroupName[];

/**
 * `satisfies` keeps the literal type of the table above — which is what makes
 * `GroupName` a union of the real names — at the cost of each entry being typed
 * only as narrowly as it is written: `apps: ["react"]` is `"react"[]`, and `ci`
 * is simply absent from the six entries that omit it. Read entries through here
 * to get the declared shape back.
 */
const groupOf = (name: GroupName): Group => groups[name];

/** The groups the CI matrix is expected to contain. */
export const ciGroups = groupNames.filter((name) => groupOf(name).ci !== false);

const TESTS_DIR = path.join(__dirname, "tests");
const CI_WORKFLOW = path.join(
  __dirname,
  "..",
  "..",
  ".github",
  "workflows",
  "ci.yml"
);

const fail = (message: string): never => {
  throw new Error(
    `e2e-groups.ts: ${message}\n\nEvery spec file has to belong to exactly ` +
      `one group, and every group needs a matrix entry in ` +
      `.github/workflows/ci.yml — otherwise CI stops running it and stays green.`
  );
};

/** Every *.spec.ts under tests/, as a tests/-relative posix path. */
function specsOnDisk(): string[] {
  return fs
    .readdirSync(TESTS_DIR, { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".spec.ts"))
    .map((file) => file.split(path.sep).join("/"));
}

/**
 * The group names in ci.yml's matrix.
 *
 * Reading the workflow back is unusual for a Playwright config, and it is here
 * because a GitHub matrix has to be literal — it cannot be computed from this
 * file. The dangerous direction of drift is silent: delete a name from the
 * matrix, or rename a group here, and those specs simply stop running, green.
 * (The reverse — a stale name in the matrix — already fails loudly in
 * `activeGroup`.)
 *
 * Understands the flow form this file writes, `group: [a, b]`, and the block
 * form a reformat might produce. Anything else throws rather than guessing.
 */
function matrixGroups(): string[] {
  const workflow = fs.readFileSync(CI_WORKFLOW, "utf8");

  const flow = workflow.match(/^[ \t]*group:[ \t]*\[([\s\S]*?)\]/m);
  if (flow) {
    return flow[1]
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
  }

  const block = workflow.match(
    /^[ \t]*group:[ \t]*\r?\n((?:[ \t]*-[ \t]*[\w-]+[ \t]*\r?\n)+)/m
  );
  if (block) {
    return block[1]
      .split("\n")
      .map((line) => line.replace(/^[ \t]*-[ \t]*/, "").trim())
      .filter(Boolean);
  }

  return fail(
    `could not find the e2e matrix's \`group:\` list in ${path.relative(
      __dirname,
      CI_WORKFLOW
    )}. If the matrix was reformatted, either restore \`group: [a, b, c]\` or ` +
      `teach matrixGroups() the new shape`
  );
}

/**
 * The cost of naming the jobs is that this mapping can rot, and every way it
 * rots is silent. So it is checked on every config load — in each CI job and in
 * a plain `pnpm e2e` — and throws before a single dev server starts.
 */
function assertGroupsAreComplete(): void {
  const owner = new Map<string, GroupName>();

  for (const name of groupNames) {
    // A group name becomes a job name, an artifact name and a blob file name.
    if (!/^[a-z0-9-]+$/.test(name)) {
      fail(`group "${name}" is not a safe slug ([a-z0-9-]+)`);
    }
    for (const spec of groupOf(name).specs) {
      if (!fs.existsSync(path.join(TESTS_DIR, spec))) {
        fail(`group "${name}" lists tests/${spec}, which does not exist`);
      }
      const other = owner.get(spec);
      if (other) fail(`tests/${spec} is in both "${other}" and "${name}"`);
      owner.set(spec, name);
    }
  }

  const orphans = specsOnDisk().filter((spec) => !owner.has(spec));
  if (orphans.length) {
    fail(
      `no group runs ${orphans.map((spec) => `tests/${spec}`).join(", ")}. ` +
        `Add each to a group's \`specs\``
    );
  }

  /**
   * Which app each spec needs, read off its own source. Only direct
   * `projects.<key>` references are visible here, which is every reference
   * today; an indirect one (`projects[name]`, or a helper in a third file)
   * would slip through and surface as a bare ERR_CONNECTION_REFUSED on a port
   * number, so keep them direct.
   */
  for (const [spec, name] of owner) {
    const source = fs.readFileSync(path.join(TESTS_DIR, spec), "utf8");
    const needed = new Set<AppKey>();
    for (const [, key] of source.matchAll(/\bprojects\.(\w+)/g)) {
      needed.add(appServing(key as PageKey));
    }
    for (const app of needed) {
      if (!groupOf(name).apps.includes(app)) {
        fail(
          `tests/${spec} navigates to the "${app}" app, but group "${name}" ` +
            `does not boot it — add "${app}" to its \`apps\``
        );
      }
    }
  }

  const inMatrix = new Set(matrixGroups());
  const missing = ciGroups.filter((name) => !inMatrix.has(name));
  const unknown = [...inMatrix].filter(
    (name) => !ciGroups.includes(name as GroupName)
  );
  if (missing.length || unknown.length) {
    fail(
      `ci.yml's e2e matrix disagrees with this file.` +
        (missing.length ? ` No matrix entry for: ${missing.join(", ")}.` : "") +
        (unknown.length ? ` Not a CI group: ${unknown.join(", ")}.` : "")
    );
  }
}

assertGroupsAreComplete();

export type ActiveGroup = Group & { name: GroupName };

/** The group named by E2E_GROUP, or undefined for "the whole suite". */
export function activeGroup(): ActiveGroup | undefined {
  const name = process.env.E2E_GROUP;
  if (!name) return undefined;
  if (!groupNames.includes(name as GroupName)) {
    fail(`E2E_GROUP="${name}" is not a group. Known: ${groupNames.join(", ")}`);
  }
  return { name: name as GroupName, ...groups[name as GroupName] };
}

/**
 * A group boots only its own apps. With no group — every local run — that is
 * the union of every group's apps, which is every app: derived rather than
 * listed, so an app nothing needs cannot linger in the list. Filtering
 * `appKeys` rather than mapping the group's own array keeps the servers in
 * canonical port order however a group happens to list them.
 */
export const appsFor = (group: ActiveGroup | undefined): AppKey[] =>
  group ? appKeys.filter((key) => group.apps.includes(key)) : appKeys;

/**
 * One line above the webServer output. Without it, a spec that reaches an app
 * its group did not boot fails with a bare port number and nothing to tie it
 * back to.
 */
export const describeGroup = (group: ActiveGroup): string =>
  `e2e group "${group.name}": ${group.specs.join(", ")} on ` +
  group.apps.map((app) => `${app} (${appOrigin(app)})`).join(", ");
