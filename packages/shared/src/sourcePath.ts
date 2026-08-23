/**
 * One canonical reading of a source location.
 *
 * Adapters hand us file paths in three shapes: Turbopack's `[project]/app/page.tsx`
 * marker, an absolute path from a source map, and babel-jsx's project-relative
 * `/src/Button.tsx`. Every consumer used to reconcile those itself, which is how
 * the link template and the clipboard ended up disagreeing about the same file.
 *
 * `resolveSourcePath` is the only place that reconciles them. It returns both
 * forms so callers pick one instead of assembling their own:
 *
 * - `filePath` + `projectPath` for link templates, which all interpolate
 *   `${projectPath}${filePath}` and must never double up.
 * - `absolute` for a complete path on its own: `copy-path`, which is pasted
 *   into a terminal, and prompt templates, whose `${filePath}` has never joined
 *   the root itself.
 */
export type ResolvedSourcePath = {
  /** Project-relative, always leading separator. Never carries `projectPath`. */
  filePath: string;
  /** Project root, or `""` when the file could not be placed inside one. */
  projectPath: string;
  /** `projectPath + filePath`. */
  absolute: string;
};

const TURBOPACK_PREFIX = "[project]/";

/**
 * A leading `/` is not enough to call a path absolute here: babel-jsx emits
 * project-relative paths that start with one (`/src/Button.tsx`), and templates
 * have always joined those onto `projectPath`. Only a drive letter is
 * unambiguous on sight; a POSIX absolute path is recognised by living under the
 * known project root instead.
 */
function hasDriveLetter(path: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(path);
}

/** Trailing separators would double up when the root is re-joined. */
function normalizeRoot(projectPath: string | undefined): string {
  if (!projectPath) return "";
  return projectPath.replace(/[\\/]+$/, "");
}

/**
 * The part of `path` below `root`, with its leading separator, or `null` when
 * `path` lives somewhere else. Matching stops at a separator so `/repo-old` is
 * not read as a child of `/repo`.
 */
function relativeToRoot(path: string, root: string): string | null {
  if (!root) return null;
  if (path === root) return "/";
  for (const separator of ["/", "\\"]) {
    if (path.startsWith(root + separator)) {
      return path.slice(root.length);
    }
  }
  return null;
}

export function resolveSourcePath(
  filePath: string,
  projectPath?: string
): ResolvedSourcePath {
  const root = normalizeRoot(projectPath);

  if (filePath.startsWith(TURBOPACK_PREFIX)) {
    // Without a root the marker cannot be expanded. Keeping it beats inventing
    // a plausible-looking `/app/page.tsx` that points at the filesystem root.
    if (!root) return { filePath, projectPath: "", absolute: filePath };
    const relative = "/" + filePath.slice(TURBOPACK_PREFIX.length);
    return { filePath: relative, projectPath: root, absolute: root + relative };
  }

  // An absolute path inside the project: hand back the part below the root so
  // the template can re-join it, rather than letting it prefix the root twice.
  const belowRoot = relativeToRoot(filePath, root);
  if (belowRoot !== null) {
    return { filePath: belowRoot, projectPath: root, absolute: filePath };
  }

  // Absolute and outside the project. The path is already complete, so blanking
  // `projectPath` is what stops the template prefixing it.
  if (hasDriveLetter(filePath)) {
    return { filePath, projectPath: "", absolute: filePath };
  }

  const relative = filePath.startsWith("/") ? filePath : "/" + filePath;
  return {
    filePath: relative,
    projectPath: root,
    absolute: root + relative,
  };
}
