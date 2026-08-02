// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import type { FullElementInfo } from "../adapters/adapterApi";
import { buildPrompt, buildPromptDeeplink } from "./buildPrompt";

function elementInfo(): FullElementInfo {
  const htmlElement = document.createElement("button");
  htmlElement.dataset.locatorjsId = "remove-me";
  htmlElement.innerHTML = "<span>Save</span>";
  return {
    htmlElement,
    thisElement: {
      box: { x: 1, y: 2, width: 30, height: 10 },
      label: "Save button",
      link: {
        filePath: "[project]/src/Button.tsx",
        projectPath: "/repo",
        line: 12,
        column: 4,
      },
    },
    parentElements: [],
    componentBox: { x: 1, y: 2, width: 30, height: 10 },
    componentsLabels: [{ label: "Button", link: null }],
  };
}

describe("buildPrompt", () => {
  test("fills element context and strips Locator attributes", () => {
    const prompt = buildPrompt(
      elementInfo(),
      {},
      "${componentName}|${filePath}|${line}|${htmlSnippet}"
    );
    expect(prompt).toContain("Button|/repo/src/Button.tsx|12|");
    expect(prompt).toContain("<button><span>Save</span></button>");
    expect(prompt).not.toContain("data-locatorjs");
  });

  test("ignores a deprecated global prompt when an action has no template", () => {
    const prompt = buildPrompt(elementInfo(), {
      promptTemplate: "legacy global",
    } as never);

    expect(prompt).toContain("Please help me update this UI element.");
    expect(prompt).not.toContain("legacy global");
  });

  test("builds guarded Cursor and Windsurf deeplinks", () => {
    expect(buildPromptDeeplink("cursor", "fix this")).toBe(
      "cursor://anysphere.cursor-deeplink/prompt?text=fix%20this"
    );
    expect(buildPromptDeeplink("windsurf", "fix this")).toBe(
      "windsurf://cascade/newChat?prompt=fix%20this"
    );
    expect(
      buildPromptDeeplink("cursor", "a".repeat(20_000)).length
    ).toBeLessThanOrEqual(8000);
  });
});
