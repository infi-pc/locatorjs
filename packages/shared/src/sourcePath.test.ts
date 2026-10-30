import { describe, expect, test } from "vitest";
import { resolveSourcePath } from "./sourcePath";

describe("resolveSourcePath – Turbopack [project]/ marker", () => {
  test("expands the marker against the project root", () => {
    expect(
      resolveSourcePath("[project]/src/page.tsx", "/Users/me/app")
    ).toEqual({
      filePath: "/src/page.tsx",
      projectPath: "/Users/me/app",
      absolute: "/Users/me/app/src/page.tsx",
    });
  });

  test("does not double the separator on a root with a trailing slash", () => {
    expect(
      resolveSourcePath("[project]/src/page.tsx", "/Users/me/app/")
    ).toEqual({
      filePath: "/src/page.tsx",
      projectPath: "/Users/me/app",
      absolute: "/Users/me/app/src/page.tsx",
    });
  });

  test("keeps the marker when there is no root to expand it against", () => {
    // A recognisably broken path beats `/src/page.tsx`, which looks resolvable
    // but points at the filesystem root.
    expect(resolveSourcePath("[project]/src/page.tsx")).toEqual({
      filePath: "[project]/src/page.tsx",
      projectPath: "",
      absolute: "[project]/src/page.tsx",
    });
  });
});

describe("resolveSourcePath – absolute paths inside the project", () => {
  test("splits the root back off so a template cannot re-apply it", () => {
    expect(
      resolveSourcePath("/Users/me/app/src/page.tsx", "/Users/me/app")
    ).toEqual({
      filePath: "/src/page.tsx",
      projectPath: "/Users/me/app",
      absolute: "/Users/me/app/src/page.tsx",
    });
  });

  test("matches only on a separator boundary", () => {
    // `/Users/me/app-old` is a sibling of the root, not a child of it.
    const resolved = resolveSourcePath(
      "/Users/me/app-old/src/page.tsx",
      "/Users/me/app"
    );

    expect(resolved.absolute).toBe(
      "/Users/me/app/Users/me/app-old/src/page.tsx"
    );
    expect(resolved.filePath).toBe("/Users/me/app-old/src/page.tsx");
  });

  test("handles the file being the root itself", () => {
    expect(resolveSourcePath("/Users/me/app", "/Users/me/app")).toEqual({
      filePath: "/",
      projectPath: "/Users/me/app",
      absolute: "/Users/me/app",
    });
  });

  test("splits a Windows root off a Windows path", () => {
    expect(
      resolveSourcePath(
        "C:\\Users\\me\\app\\src\\page.tsx",
        "C:\\Users\\me\\app"
      )
    ).toEqual({
      filePath: "\\src\\page.tsx",
      projectPath: "C:\\Users\\me\\app",
      absolute: "C:\\Users\\me\\app\\src\\page.tsx",
    });
  });
});

describe("resolveSourcePath – project-relative paths", () => {
  test("uses an explicit kind before the inside-root heuristic", () => {
    expect(
      resolveSourcePath(
        "/repo-sibling/src/Button.tsx",
        "/repo",
        "project-relative"
      )
    ).toEqual({
      filePath: "/repo-sibling/src/Button.tsx",
      projectPath: "/repo",
      absolute: "/repo/repo-sibling/src/Button.tsx",
    });
  });
  test("keeps babel-jsx's leading-slash path relative and joinable", () => {
    // babel-jsx emits `/src/Button.tsx` for a file at `<root>/src/Button.tsx`.
    expect(resolveSourcePath("/src/Button.tsx", "/repo")).toEqual({
      filePath: "/src/Button.tsx",
      projectPath: "/repo",
      absolute: "/repo/src/Button.tsx",
    });
  });

  test("gives a bare relative path its leading separator", () => {
    expect(resolveSourcePath("src/Button.tsx", "/repo")).toEqual({
      filePath: "/src/Button.tsx",
      projectPath: "/repo",
      absolute: "/repo/src/Button.tsx",
    });
  });

  test("leaves the path alone when no root is configured", () => {
    expect(resolveSourcePath("/src/Button.tsx")).toEqual({
      filePath: "/src/Button.tsx",
      projectPath: "",
      absolute: "/src/Button.tsx",
    });
  });
});

describe("resolveSourcePath – absolute paths outside the project", () => {
  test("blanks projectPath for a Windows path under a different root", () => {
    // Otherwise `${projectPath}${filePath}` would produce `C:\repo` + `D:\lib\…`.
    expect(
      resolveSourcePath("D:\\lib\\Button.tsx", "C:\\Users\\me\\app")
    ).toEqual({
      filePath: "D:\\lib\\Button.tsx",
      projectPath: "",
      absolute: "D:\\lib\\Button.tsx",
    });
  });
});

describe("resolveSourcePath – invariants", () => {
  const cases: [string, string | undefined][] = [
    ["[project]/src/page.tsx", "/Users/me/app"],
    ["[project]/src/page.tsx", undefined],
    ["/Users/me/app/src/page.tsx", "/Users/me/app"],
    ["/src/Button.tsx", "/repo"],
    ["src/Button.tsx", "/repo"],
    ["/src/Button.tsx", undefined],
    ["D:\\lib\\Button.tsx", "C:\\app"],
  ];

  test.each(cases)(
    "projectPath + filePath === absolute for (%s, %s)",
    (filePath, projectPath) => {
      const resolved = resolveSourcePath(filePath, projectPath);
      expect(resolved.projectPath + resolved.filePath).toBe(resolved.absolute);
    }
  );
});
