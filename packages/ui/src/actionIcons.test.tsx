import { describe, expect, test } from "vitest";
import { actionLabel } from "./actionIcons";

const targets = {
  cursor: { label: "Cursor", url: "cursor://file/${filePath}" },
  vscode: { label: "VS Code", url: "vscode://file/${filePath}" },
};

describe("actionLabel", () => {
  test("uses the resolved target label for editor actions", () => {
    expect(
      actionLabel({ kind: "open-editor", targetId: "vscode" }, targets)
    ).toBe("Open in VS Code");
    expect(
      actionLabel({ kind: "open-editor", targetId: "missing" }, targets)
    ).toBe("Open in Cursor");
  });

  test("describes custom editor templates consistently", () => {
    expect(
      actionLabel(
        { kind: "open-editor", targetTemplate: "editor://${filePath}" },
        targets
      )
    ).toBe("Open custom editor link");
  });
});
