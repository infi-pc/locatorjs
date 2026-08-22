import { describe, expect, test } from "vitest";
import type { LocatorOptions, Targets } from "@locator/shared";
import {
  actionTargetUrl,
  editorNeedsSetup,
  linkTemplateUrl,
  resolveEditorLink,
} from "./linkTemplateUrl";
import type { OptionsStore } from "./optionsStore";

const targets: Targets = {
  vscode: { label: "VS Code", url: "vscode://file/${filePath}" },
  cursor: { label: "Cursor", url: "cursor://file/${filePath}" },
};

function options(effective: LocatorOptions): OptionsStore {
  return { effective: () => effective } as OptionsStore;
}

describe("resolveEditorLink", () => {
  test("follows the Editor setting", () => {
    expect(
      resolveEditorLink(targets, options({ editor: { targetId: "cursor" } }))
    ).toMatchObject({ kind: "targetId", id: "cursor" });
  });

  test("a custom template in the setting is used verbatim", () => {
    expect(
      resolveEditorLink(
        targets,
        options({ editor: { targetTemplate: "zed://${filePath}" } })
      )
    ).toEqual({ kind: "template", url: "zed://${filePath}" });
  });

  test("an explicit local target wins over the setting", () => {
    expect(
      resolveEditorLink(
        targets,
        options({ editor: { targetId: "vscode" } }),
        "cursor"
      )
    ).toMatchObject({ kind: "targetId", id: "cursor" });
  });

  test("an unrecognised local value is treated as a template", () => {
    expect(
      resolveEditorLink(targets, options({}), "myeditor://${filePath}")
    ).toEqual({ kind: "template", url: "myeditor://${filePath}" });
  });

  test("bindings do not influence it", () => {
    // Tree rows, parents entries and the welcome preview are not tied to any
    // one binding, so a target pinned on a binding must not leak into them.
    const resolved = resolveEditorLink(
      targets,
      options({
        editor: { targetId: "vscode" },
        bindings: [
          {
            trigger: { kind: "modifier-click", modifiers: "alt" },
            action: { kind: "open-editor", targetId: "cursor" },
          },
        ],
      })
    );
    expect(resolved).toMatchObject({ kind: "targetId", id: "vscode" });
  });
});

describe("editorNeedsSetup", () => {
  test("is true when nothing has been chosen", () => {
    expect(editorNeedsSetup(targets, options({}))).toBe(true);
  });

  test("is true when the chosen editor no longer exists", () => {
    expect(
      editorNeedsSetup(targets, options({ editor: { targetId: "gone" } }))
    ).toBe(true);
  });

  test("is false once an editor is chosen", () => {
    expect(
      editorNeedsSetup(targets, options({ editor: { targetId: "cursor" } }))
    ).toBe(false);
  });

  test("is false for an explicit local target, even with no setting", () => {
    expect(editorNeedsSetup(targets, options({}), "cursor")).toBe(false);
  });
});

describe("linkTemplateUrl", () => {
  test("returns the url of whatever was resolved", () => {
    expect(
      linkTemplateUrl(targets, options({ editor: { targetId: "cursor" } }))
    ).toBe("cursor://file/${filePath}");
  });

  test("still returns a url when setup is needed, so callers can preview", () => {
    // The caller decides whether to navigate; `editorNeedsSetup` is the gate.
    expect(linkTemplateUrl(targets, options({}))).toBe(
      "vscode://file/${filePath}"
    );
  });
});

describe("actionTargetUrl", () => {
  test("an action without an override follows the setting", () => {
    expect(
      actionTargetUrl({}, targets, options({ editor: { targetId: "cursor" } }))
    ).toMatchObject({ kind: "targetId", id: "cursor" });
  });

  test("an action with an override keeps it", () => {
    expect(
      actionTargetUrl(
        { targetId: "vscode" },
        targets,
        options({ editor: { targetId: "cursor" } })
      )
    ).toMatchObject({ kind: "targetId", id: "vscode" });
  });
});
