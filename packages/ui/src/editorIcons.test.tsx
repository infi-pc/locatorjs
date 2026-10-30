import { cleanup, render, screen } from "@solidjs/testing-library";
import { For } from "solid-js";
import { afterEach, describe, expect, test } from "vitest";
import { editorIconFor } from "./editorIcons";

afterEach(cleanup);

describe("editorIconFor", () => {
  test("renders TheSVG assets with the WebStorm PNG for known editors", () => {
    const editors = [
      ["vscode", "Visual Studio Code", "svg"],
      ["cursor", "Cursor", "svg"],
      ["webstorm", "WebStorm", "png"],
      ["windsurf", "Windsurf", "svg"],
      ["zed", "Zed", "svg"],
      ["nvim", "Neovim", "svg"],
    ] as const;

    render(() => (
      <For each={editors}>{([id]) => <span>{editorIconFor(id)}</span>}</For>
    ));

    for (const [, label, format] of editors) {
      const icon = screen.getByRole("img", { name: label });
      const source = icon.getAttribute("src") ?? "";
      expect(icon.tagName).toBe("IMG");
      expect(source).toMatch(
        format === "svg"
          ? /(image\/svg\+xml|\.svg(?:\?|$))/
          : /(image\/png|\.png(?:\?|$))/
      );
      expect(icon.getAttribute("width")).toBe("16");
      expect(icon.getAttribute("height")).toBe("16");
    }
  });

  test("keeps generic editor fallbacks in the Lucide set", () => {
    const { container } = render(() => (
      <>
        {editorIconFor("custom")}
        {editorIconFor("unknown")}
      </>
    ));

    expect(container.querySelectorAll("svg")).toHaveLength(2);
    expect(container.querySelector("img")).toBeNull();
  });
});
