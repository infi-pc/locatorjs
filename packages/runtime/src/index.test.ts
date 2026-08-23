// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createRoot } from "solid-js";
import { needsEditorSetup, resolveEditorTarget } from "@locator/shared";
import { setup } from "./index";
import { initOptions } from "./functions/optionsStore";
import { __resetTeamLayerForTesting } from "./functions/teamLayerStore";

vi.mock("./initRuntime", () => ({ initRuntime: vi.fn() }));

const github = {
  label: "GitHub",
  url: "https://github.com/acme/app/blob/main${filePath}#L${line}",
};
const githubDev = {
  label: "GitHub.dev",
  url: "https://github.dev/acme/app/blob/main${filePath}#L${line}",
};

const disposers: (() => void)[] = [];

function store() {
  return createRoot((dispose) => {
    disposers.push(dispose);
    return initOptions();
  });
}

/** How every navigation path decides whether it can open a link. */
function editorTarget() {
  const options = store();
  return resolveEditorTarget(options.effective().editor, options.allTargets());
}

beforeEach(() => {
  while (disposers.length) disposers.pop()!();
  localStorage.clear();
  __resetTeamLayerForTesting();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("setup({ targets })", () => {
  test("an app's own targets are a choice of editor, not an unset one", () => {
    // Regression: `DEFAULT_LAYER` pins `editor.targetId: "vscode"`, which such a
    // map does not contain. Every link then resolved to `unknown-id` and the
    // runtime opened the "pick your editor" wizard instead of navigating --
    // on locatorjs.com's own production build, every single time.
    setup({ adapter: "jsx", targets: { github, githubDev } });

    const target = editorTarget();
    expect(needsEditorSetup(target)).toBe(false);
    expect(target).toEqual({ kind: "targetId", id: "github", url: github.url });
  });

  test("an editor passed alongside targets wins over the first entry", () => {
    setup({
      targets: { github, githubDev },
      editor: { targetId: "githubDev" },
    });

    expect(editorTarget()).toEqual({
      kind: "targetId",
      id: "githubDev",
      url: githubDev.url,
    });
  });

  test("a string target shorthand is a choice too", () => {
    setup({ targets: { github: github.url } });

    expect(editorTarget()).toEqual({
      kind: "targetId",
      id: "github",
      url: github.url,
    });
  });

  test("setup without targets leaves the built-in default alone", () => {
    setup({ adapter: "jsx" });

    const target = editorTarget();
    expect(needsEditorSetup(target)).toBe(false);
    expect(target.kind === "targetId" && target.id).toBe("vscode");
  });

  test("a user's own choice still overrides the app's", () => {
    setup({ targets: { github, githubDev } });
    const options = store();

    options.setUserOrigin({ editor: { targetId: "githubDev" } });

    expect(
      resolveEditorTarget(options.effective().editor, options.allTargets())
    ).toEqual({ kind: "targetId", id: "githubDev", url: githubDev.url });
  });
});
