import { describe, expect, test, beforeEach } from "vitest";
import { buildLink, setInternalProjectPath } from "./buildLink";
import type { OptionsStore } from "./optionsStore";

// Minimal mock for OptionsStore
function createMockOptions(overrides: Record<string, unknown> = {}): OptionsStore {
  return {
    getOptions: () => ({
      projectPath: "/project",
      templateOrTemplateId: undefined,
      ...overrides,
    }),
  } as unknown as OptionsStore;
}

// Simple targets with a known template
const targets = {
  vscode: {
    url: "vscode://file/${filePath}:${line}:${column}",
    label: "VSCode",
  },
} as any;

describe("buildLink - Turbopack [project]/ prefix", () => {
  beforeEach(() => {
    setInternalProjectPath(null as any);
  });

  test("resolves [project]/ prefix with projectPath", () => {
    const options = createMockOptions({
      projectPath: "/Users/me/app",
      templateOrTemplateId: "vscode",
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
      templateOrTemplateId: "vscode",
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

    // Should not produce double slash
    expect(result).toContain("/Users/me/app/src/page.tsx");
    expect(result).not.toContain("app//src");
  });

  test("passes through paths without [project]/ prefix", () => {
    const options = createMockOptions({
      projectPath: "/Users/me/app",
      templateOrTemplateId: "vscode",
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
      projectPath: undefined,
      templateOrTemplateId: "vscode",
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

    // Without projectPath, [project]/ is kept as-is
    expect(result).toContain("[project]/src/page.tsx");
  });
});
