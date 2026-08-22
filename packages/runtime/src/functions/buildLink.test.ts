import { describe, expect, test } from "vitest";
import { allTargets, type LocatorOptions } from "@locator/shared";
import { buildLink } from "./buildLink";
import type { OptionsStore } from "./optionsStore";

function createMockOptions(effective: LocatorOptions): OptionsStore {
  return {
    effective: () => effective,
    provenance: () => ({}),
    layers: () => ({}),
    uiState: () => ({}),
    allTargets: () => ({}),
    setUserOrigin: async () => ({ ok: true as const }),
    clearUserOrigin: async () => ({ ok: true }),
    setUiState: async () => ({ ok: true as const }),
  };
}

/**
 * Links built without an explicit target follow the global Editor setting, so
 * that — not the bindings list — is what these cases configure.
 */
function editorOptions(targetId: string, options: LocatorOptions = {}) {
  return createMockOptions({ ...options, editor: { targetId } });
}

const targets = {
  vscode: {
    url: "vscode://file/${filePath}:${line}:${column}",
    label: "VSCode",
  },
} as const;

describe("buildLink - Turbopack [project]/ prefix", () => {
  test("resolves [project]/ prefix with projectPath", () => {
    const options = editorOptions("vscode", { projectPath: "/Users/me/app" });

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
    const options = editorOptions("vscode", { projectPath: "/Users/me/app/" });

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
    const options = editorOptions("vscode", { projectPath: "/Users/me/app" });

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
    const options = editorOptions("vscode");

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

describe("buildLink - optional query parameters", () => {
  const linkProps = {
    filePath: "/src/page.tsx",
    projectPath: "/repo",
    line: 10,
    column: 5,
  };

  test("includes the nvim tmux session when configured", () => {
    const result = buildLink(
      linkProps,
      allTargets,
      editorOptions("nvim", { tmuxSession: "work" })
    );

    expect(result).toBe(
      "nvim://file//repo/src/page.tsx:10:5?tmux-session=work"
    );
  });

  test("removes the unresolved nvim query parameter when unset", () => {
    const result = buildLink(linkProps, allTargets, editorOptions("nvim"));

    expect(result).toBe("nvim://file//repo/src/page.tsx:10:5");
    expect(result).not.toContain("?");
  });

  test("does not alter targets without optional query parameters", () => {
    const result = buildLink(linkProps, allTargets, editorOptions("vscode"));

    expect(result).toBe("vscode://file//repo/src/page.tsx:10:5");
  });

  test("preserves fully resolved query parameters", () => {
    const result = buildLink(linkProps, allTargets, editorOptions("webstorm"));

    expect(result).toBe(
      "webstorm://open?file=/repo/src/page.tsx&line=10&column=5"
    );
  });

  test("uses the Editor setting for links outside direct actions", () => {
    // An editor pinned on a binding is that binding's business; the tree, the
    // parents menu and the welcome preview follow the global setting.
    const result = buildLink(
      linkProps,
      allTargets,
      createMockOptions({
        editor: { targetId: "webstorm" },
        bindings: [
          {
            trigger: { kind: "modifier-click", modifiers: "alt" },
            action: { kind: "open-editor", targetId: "cursor" },
          },
        ],
      })
    );

    expect(result).toContain("webstorm://open");
  });

  test("an explicit target beats the Editor setting", () => {
    const result = buildLink(
      linkProps,
      allTargets,
      createMockOptions({ editor: { targetId: "vscode" } }),
      "webstorm"
    );

    expect(result).toContain("webstorm://open");
  });
});
