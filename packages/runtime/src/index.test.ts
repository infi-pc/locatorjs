// @vitest-environment jsdom
import { strictConfig } from "@locator/shared";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  getTeamConfig,
  __resetTeamLayerForTesting,
} from "./functions/teamLayerStore";
import { setup } from "./index";
import { initRuntime } from "./initRuntime";
import { installShadowRootTracking } from "./functions/shadowRoots";

vi.mock("./initRuntime", () => ({ initRuntime: vi.fn() }));
vi.mock("./functions/shadowRoots", () => ({
  installShadowRootTracking: vi.fn(),
}));

const github = {
  label: "GitHub",
  url: "https://github.com/acme/app/blob/main${filePath}#L${line}",
};
const githubDev = {
  label: "GitHub.dev",
  url: "https://github.dev/acme/app/blob/main${filePath}#L${line}",
};

function effective() {
  const team = getTeamConfig();
  return strictConfig.effectiveOptions(
    strictConfig.resolveConfig(
      { default: strictConfig.DEFAULT_LAYER, team: team.layer },
      team.targets
    )
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  localStorage.clear();
  __resetTeamLayerForTesting();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("setup", () => {
  test("selects the first app target when none is specified", () => {
    expect(setup({ adapter: "jsx", targets: { github, githubDev } })).toEqual({
      ok: true,
    });
    expect(effective().editor).toMatchObject({
      kind: "selected",
      label: "GitHub",
      destination: { kind: "target", id: "github" },
    });
  });

  test("honors an explicit editor in the same target registry", () => {
    expect(
      setup({
        targets: { github, githubDev },
        editor: { kind: "target", id: "githubDev" },
      })
    ).toEqual({ ok: true });
    expect(effective().editor).toMatchObject({
      kind: "selected",
      destination: { kind: "target", id: "githubDev" },
    });
  });

  test("accepts target URL shorthand", () => {
    expect(setup({ targets: { github: github.url } })).toEqual({ ok: true });
    expect(effective().editor).toMatchObject({
      kind: "selected",
      destination: { kind: "target", id: "github" },
    });
  });

  test("exposes the built-in editor as a suggestion, not an implicit choice", () => {
    expect(setup({ adapter: "jsx" })).toEqual({ ok: true });
    expect(effective().editor).toMatchObject({
      kind: "needs-selection",
      reason: "default-only",
      suggestion: { kind: "target", id: "vscode" },
    });
  });

  test("replaces the team configuration atomically", () => {
    expect(setup({ projectPath: "/first", debugMode: true })).toEqual({
      ok: true,
    });
    expect(setup({ adapter: "jsx" })).toEqual({ ok: true });

    const snapshot = getTeamConfig();
    expect(strictConfig.encodeLayer(snapshot.layer)).toEqual({
      adapter: "jsx",
    });
  });

  test("invalid input leaves the prior snapshot and effects untouched", () => {
    expect(setup({ projectPath: "/valid" })).toEqual({ ok: true });
    vi.runOnlyPendingTimers();
    vi.clearAllMocks();
    const before = getTeamConfig();

    const result = setup({
      editor: { kind: "template", template: "javascript:alert(1)" },
    });

    expect(result.ok).toBe(false);
    expect(getTeamConfig()).toBe(before);
    vi.runOnlyPendingTimers();
    expect(initRuntime).not.toHaveBeenCalled();
    expect(installShadowRootTracking).not.toHaveBeenCalled();
  });

  test("reports every rejection to the console, since callers ignore the result", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      setup({ editor: { kind: "template", template: "javascript:alert(1)" } });

      expect(consoleError).toHaveBeenCalledTimes(1);
      const [message] = consoleError.mock.calls[0] as [string];
      expect(message).toContain("No part of it was applied");
      expect(message).toContain("/editor/template");
      expect(message).toContain("unsafe-template");
    } finally {
      consoleError.mockRestore();
    }
  });

  test("stays silent when the configuration is accepted", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    try {
      expect(setup({ projectPath: "/valid" })).toEqual({ ok: true });
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      consoleError.mockRestore();
    }
  });
});
