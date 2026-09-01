import { strictConfig } from "@locator/shared";
import { describe, expect, test } from "vitest";
import type { LinkProps } from "../types/types";
import { buildLink } from "./buildLink";

const linkProps: LinkProps = {
  filePath: "/src/page.tsx",
  projectPath: "/repo",
  line: 10,
  column: 5,
};

function context(input: strictConfig.LocatorConfigInput): Readonly<{
  options: { effective: () => strictConfig.EffectiveOptions };
  editor: strictConfig.SelectedEditor;
}> {
  const compiled = strictConfig.compileSetup(input);
  if (!compiled.ok) throw new Error("Invalid link fixture.");
  const effective = strictConfig.effectiveOptions(
    strictConfig.resolveConfig(
      { default: strictConfig.DEFAULT_LAYER, team: compiled.value.layer },
      compiled.value.targets
    )
  );
  if (effective.editor.kind !== "selected") {
    throw new Error("Link fixture needs a selected editor.");
  }
  return { options: { effective: () => effective }, editor: effective.editor };
}

function link(
  input: strictConfig.LocatorConfigInput,
  props: LinkProps = linkProps
): string {
  const { options, editor } = context(input);
  return buildLink(props, options, editor);
}

describe("buildLink", () => {
  test.each([
    "[project]/src/page.tsx",
    "/Users/me/app/src/page.tsx",
    "/src/page.tsx",
  ])("applies the configured project root once to %s", (filePath) => {
    expect(
      link(
        {
          projectPath: "/Users/me/app/",
          editor: { kind: "target", id: "vscode" },
        },
        { ...linkProps, filePath, projectPath: "" }
      )
    ).toBe("vscode://file//Users/me/app/src/page.tsx:10:5");
  });

  test("leaves a project marker when no root is available", () => {
    expect(
      link(
        { editor: { kind: "target", id: "vscode" } },
        { ...linkProps, filePath: "[project]/src/page.tsx", projectPath: "" }
      )
    ).toContain("[project]/src/page.tsx");
  });

  test("includes an optional tmux session only when configured", () => {
    expect(
      link({
        editor: { kind: "target", id: "nvim" },
        tmuxSession: "work",
      })
    ).toBe("nvim://file//repo/src/page.tsx:10:5?tmux-session=work");

    expect(link({ editor: { kind: "target", id: "nvim" } })).toBe(
      "nvim://file//repo/src/page.tsx:10:5"
    );
  });

  test("preserves resolved query parameters", () => {
    expect(link({ editor: { kind: "target", id: "webstorm" } })).toBe(
      "webstorm://open?file=/repo/src/page.tsx&line=10&column=5"
    );
  });

  test("uses an explicitly selected custom destination", () => {
    expect(
      link({
        editor: {
          kind: "template",
          template: "zed://file${projectPath}${filePath}:${line}",
        },
      })
    ).toBe("zed://file/repo/src/page.tsx:10");
  });

  test("rewrites the fully evaluated link", () => {
    expect(
      link({
        editor: { kind: "target", id: "vscode" },
        replacePath: { from: "^vscode://file//repo", to: "zed://workspace" },
      })
    ).toBe("zed://workspace/src/page.tsx:10:5");
  });
});
