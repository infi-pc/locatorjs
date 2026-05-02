import { describe, expect, test } from "vitest";
import type { LocatorOptions } from "@locator/shared";
import { buildLink } from "./buildLink";
import type { OptionsStore } from "./optionsStore";

function createMockOptions(effective: LocatorOptions): OptionsStore {
  return {
    effective: () => effective,
    provenance: () => ({}),
    uiState: () => ({}),
    allTargets: () => ({}),
    setUserProject: async () => ({ ok: true as const }),
    setUiState: async () => ({ ok: true as const }),
  };
}

const targets = {
  vscode: {
    url: "vscode://file/${filePath}:${line}:${column}",
    label: "VSCode",
  },
} as const;

describe("buildLink - Turbopack [project]/ prefix", () => {
  test("resolves [project]/ prefix with projectPath", () => {
    const options = createMockOptions({
      projectPath: "/Users/me/app",
      targetId: "vscode",
    });

    const result = buildLink(
      {
        filePath: "[project]/src/page.tsx",
        projectPath: "",
        line: 10,
        column: 5,
      },
      targets,
      options
    );

    expect(result).toContain("/Users/me/app/src/page.tsx");
  });

  test("handles projectPath with trailing slash", () => {
    const options = createMockOptions({
      projectPath: "/Users/me/app/",
      targetId: "vscode",
    });

    const result = buildLink(
      {
        filePath: "[project]/src/page.tsx",
        projectPath: "",
        line: 10,
        column: 5,
      },
      targets,
      options
    );

    expect(result).toContain("/Users/me/app/src/page.tsx");
    expect(result).not.toContain("app//src");
  });

  test("passes through paths without [project]/ prefix", () => {
    const options = createMockOptions({
      projectPath: "/Users/me/app",
      targetId: "vscode",
    });

    const result = buildLink(
      {
        filePath: "/absolute/path/src/page.tsx",
        projectPath: "",
        line: 10,
        column: 5,
      },
      targets,
      options
    );

    expect(result).toContain("/absolute/path/src/page.tsx");
  });

  test("leaves [project]/ prefix if no projectPath available", () => {
    const options = createMockOptions({
      targetId: "vscode",
    });

    const result = buildLink(
      {
        filePath: "[project]/src/page.tsx",
        projectPath: "",
        line: 10,
        column: 5,
      },
      targets,
      options
    );

    expect(result).toContain("[project]/src/page.tsx");
  });
});
