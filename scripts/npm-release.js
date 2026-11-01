const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const repository = "https://github.com/infi-pc/locatorjs";
const registry = "https://registry.npmjs.org";
const root = path.resolve(__dirname, "..");
const output = path.join(root, ".context/npm-release");

function releasePackages(directory, tag) {
  const version = JSON.parse(
    fs.readFileSync(path.join(directory, "lerna.json"))
  ).version;
  if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag)) {
    throw new Error(`Expected a stable release tag, received ${tag}`);
  }
  if (tag !== `v${version}`) {
    throw new Error(`Tag ${tag} does not match lerna version ${version}`);
  }
  const packages = fs
    .readdirSync(path.join(directory, "packages"))
    .sort()
    .map((name) => path.join(directory, "packages", name))
    .filter((location) => fs.existsSync(path.join(location, "package.json")))
    .map((location) => ({
      location,
      manifest: JSON.parse(
        fs.readFileSync(path.join(location, "package.json"))
      ),
    }));
  const byName = new Map(packages.map((pkg) => [pkg.manifest.name, pkg]));
  const ordered = [];
  const visiting = new Set();
  const visited = new Set();
  function visit(pkg) {
    const { manifest } = pkg;
    if (visited.has(manifest.name)) return;
    if (visiting.has(manifest.name)) {
      throw new Error(`Cyclic release dependency: ${manifest.name}`);
    }
    if (manifest.private) {
      throw new Error(`Public release depends on private ${manifest.name}`);
    }
    if (manifest.version !== version) {
      throw new Error(`${manifest.name} is not version ${version}`);
    }
    if (manifest.repository?.url !== repository) {
      throw new Error(`${manifest.name} must declare repository ${repository}`);
    }
    visiting.add(manifest.name);
    for (const name of Object.keys({
      ...manifest.dependencies,
      ...manifest.optionalDependencies,
    })) {
      if (byName.has(name)) visit(byName.get(name));
      else if (name.startsWith("@locator/")) {
        throw new Error(`Missing release dependency ${name}`);
      }
    }
    visiting.delete(manifest.name);
    visited.add(manifest.name);
    ordered.push(pkg);
  }
  packages.filter((pkg) => !pkg.manifest.private).forEach(visit);
  if (!ordered.length) throw new Error("No public release packages found");
  return { version, packages: ordered };
}

function assertPublishEvent(env, event, tag) {
  if (
    env.GITHUB_ACTIONS !== "true" ||
    env.GITHUB_REPOSITORY !== "infi-pc/locatorjs" ||
    env.GITHUB_EVENT_NAME !== "push" ||
    env.GITHUB_REF !== `refs/tags/${tag}` ||
    event.ref !== `refs/tags/${tag}` ||
    event.created !== true ||
    event.deleted !== false ||
    event.forced !== false
  ) {
    throw new Error(
      "Publishing requires a newly created version tag on GitHub"
    );
  }
}

function integrity(file) {
  return `sha512-${crypto
    .createHash("sha512")
    .update(fs.readFileSync(file))
    .digest("base64")}`;
}

function alreadyPublished(entry, published) {
  if (!published) return false;
  if (published.dist?.integrity !== entry.integrity) {
    throw new Error(
      `${entry.name}@${entry.version} already exists with different bytes`
    );
  }
  return true;
}

function assertNoDowngrade(version, latest) {
  if (!/^\d+\.\d+\.\d+$/.test(latest || "")) return;
  const requested = version.split(".").map(Number);
  const current = latest.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (requested[i] > current[i]) return;
    if (requested[i] < current[i]) {
      throw new Error(
        `Refusing to replace latest ${latest} with older ${version}`
      );
    }
  }
}

async function registryJSON(url, attempts = 3, missingAllowed = true) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "cache-control": "no-cache" },
        signal: AbortSignal.timeout(30_000),
      });
      if (response.status === 404 && missingAllowed) return null;
      if (!response.ok)
        throw new Error(`Registry returned ${response.status} for ${url}`);
      return await response.json();
    } catch (error) {
      if (attempt === attempts - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

function run(command, args, cwd = root) {
  execFileSync(command, args, { cwd, stdio: "inherit" });
}

function pack(tag, release) {
  fs.mkdirSync(output, { recursive: true });
  const packages = release.packages.map(({ location, manifest }) => {
    run(
      "pnpm",
      ["--config.ignore-scripts=true", "pack", "--pack-destination", output],
      location
    );
    const filename = `${manifest.name.replace(/^@/, "").replace("/", "-")}-${
      release.version
    }.tgz`;
    return {
      name: manifest.name,
      version: release.version,
      filename,
      integrity: integrity(path.join(output, filename)),
    };
  });
  fs.writeFileSync(
    path.join(output, "plan.json"),
    JSON.stringify({ tag, packages }, null, 2) + "\n"
  );
}

function readPlan(tag, release, directory = output) {
  const plan = JSON.parse(fs.readFileSync(path.join(directory, "plan.json")));
  if (plan.tag !== tag || plan.packages.length !== release.packages.length) {
    throw new Error("Artifact plan does not match this release");
  }
  plan.packages.forEach((entry, index) => {
    const { manifest } = release.packages[index];
    const filename = `${manifest.name.replace(/^@/, "").replace("/", "-")}-${
      release.version
    }.tgz`;
    if (
      entry.name !== manifest.name ||
      entry.version !== release.version ||
      entry.filename !== filename ||
      entry.integrity !== integrity(path.join(directory, filename))
    )
      throw new Error(`Artifact mismatch for ${manifest.name}`);
  });
  return plan.packages;
}

async function publish(entries) {
  // Check every package before publishing any, so a conflicting existing
  // version cannot leave an avoidable partial release.
  const pending = [];
  for (const entry of entries) {
    const encoded = entry.name.replace("/", "%2f");
    const published = await registryJSON(
      `${registry}/${encoded}/${entry.version}`
    );
    const tags = await registryJSON(
      `${registry}/-/package/${encoded}/dist-tags`
    );
    assertNoDowngrade(entry.version, tags?.latest);
    if (alreadyPublished(entry, published)) {
      console.info(
        `Already published identical ${entry.name}@${entry.version}`
      );
    } else pending.push(entry);
  }
  for (const entry of pending) {
    run("npm", [
      "publish",
      path.join(output, entry.filename),
      "--ignore-scripts",
      "--access",
      "public",
      "--tag",
      "latest",
      "--provenance",
      `--registry=${registry}`,
    ]);
    const url = `${registry}/${entry.name.replace("/", "%2f")}/${
      entry.version
    }`;
    const published = await registryJSON(url, 24, false);
    alreadyPublished(entry, published);
    console.info(`Verified ${entry.name}@${entry.version}`);
  }
}

async function main() {
  const mode = process.argv[2];
  if (!["--pack", "--dry-run", "--publish"].includes(mode)) {
    throw new Error("Use --pack, --dry-run or --publish");
  }
  const version = JSON.parse(
    fs.readFileSync(path.join(root, "lerna.json"))
  ).version;
  const tag = process.env.RELEASE_TAG || `v${version}`;
  const release = releasePackages(root, tag);
  if (mode === "--pack") return pack(tag, release);
  if (mode === "--publish") {
    const event = JSON.parse(
      fs.readFileSync(process.env.GITHUB_EVENT_PATH || "")
    );
    assertPublishEvent(process.env, event, tag);
    return publish(readPlan(tag, release));
  }
  // npm 11 rejects even dry runs of an existing version unless forced.
  // This flag is paired only with --dry-run; real publishing never uses it.
  for (const entry of readPlan(tag, release)) {
    run("npm", [
      "publish",
      path.join(output, entry.filename),
      "--dry-run",
      "--force",
      "--ignore-scripts",
      "--access",
      "public",
      "--tag",
      "latest",
      `--registry=${registry}`,
    ]);
  }
}

module.exports = {
  releasePackages,
  assertPublishEvent,
  alreadyPublished,
  assertNoDowngrade,
  readPlan,
};
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
