import { strictConfig } from "@locator/shared";
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, test, vi } from "vitest";
import { AdvancedSettings, SettingsSources } from "./AdvancedSettings";

afterEach(cleanup);

const ok = async () => ({ ok: true as const });
const DEFAULT_LAYER = strictConfig.encodeLayer(strictConfig.DEFAULT_LAYER);
const targets = {
  vscode: { label: "VS Code", url: "vscode://file/${filePath}" },
};

describe("AdvancedSettings", () => {
  test("shows project, link, and diagnostic settings without global editor or prompt controls", () => {
    render(() => (
      <AdvancedSettings
        scope={{ layer: "user-origin", label: "This origin", write: ok }}
        layers={{ default: DEFAULT_LAYER, "user-origin": {} }}
        targets={targets}
      />
    ));

    expect(screen.getByText("Project path")).toBeTruthy();
    expect(screen.getByText("Path replace")).toBeTruthy();
    expect(screen.getAllByText("Debug mode").length).toBeGreaterThan(0);
    expect(screen.queryByText("Default editor")).toBeNull();
    expect(screen.queryByText("AI prompt template")).toBeNull();
  });

  test("keeps Diagnostics folded until its summary is clicked", async () => {
    render(() => (
      <AdvancedSettings
        scope={{ layer: "user-origin", label: "This origin", write: ok }}
        layers={{ default: DEFAULT_LAYER, "user-origin": {} }}
        targets={targets}
      />
    ));

    const summary = screen.getByText("Diagnostics");
    const section = summary.closest("details") as HTMLDetailsElement;
    expect(section.open).toBe(false);

    await fireEvent.click(summary);
    expect(section.open).toBe(true);
  });

  test("shows provenance, reverts the current scope, and validates path replacement", async () => {
    const [values, setValues] = createSignal<strictConfig.SerializedLayerV3>({
      projectPath: "/custom",
    });
    const write = vi.fn(async (patch: strictConfig.LayerPatchInput) => {
      setValues((current) => applyPatch(current, patch));
      return { ok: true as const };
    });
    render(() => (
      <AdvancedSettings
        scope={{ layer: "user-origin", label: "This origin", write }}
        layers={{
          default: DEFAULT_LAYER,
          team: { projectPath: "/team" },
          "user-origin": values(),
        }}
        targets={targets}
      />
    ));

    await screen.getByRole("button", { name: "Revert Project path" }).click();
    expect(write).toHaveBeenCalledWith({ unset: ["projectPath"] });

    await fireEvent.change(screen.getByPlaceholderText("From"), {
      target: { value: "[" },
    });
    expect(
      await screen.findByText("From must be a valid regular expression.")
    ).toBeTruthy();
  });
});

describe("SettingsSources", () => {
  test("renders action-owned configuration and unavailable layers", () => {
    render(() => (
      <SettingsSources
        layers={{
          default: DEFAULT_LAYER,
          "user-extension": {
            bindings: [
              {
                trigger: { kind: "modifier-click", modifiers: ["alt"] },
                action: {
                  kind: "open-editor",
                  destination: { kind: "target", id: "vscode" },
                },
              },
            ],
          },
        }}
        targets={{ vscode: { label: "VS Code", url: "vscode://file" } }}
        unavailableLayers={["team", "user-origin"]}
      />
    ));

    const summary = screen.getByText("Configuration sources");
    expect((summary.closest("details") as HTMLDetailsElement).open).toBe(false);
    expect(screen.getAllByText(/open VS Code/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Unavailable without a connected LocatorJS page")
    ).toHaveLength(2);
  });
});

function applyPatch(
  current: strictConfig.SerializedLayerV3,
  input: strictConfig.LayerPatchInput
): strictConfig.SerializedLayerV3 {
  const layer = strictConfig.parseLayer(current);
  const patch = strictConfig.parseLayerPatch(input);
  if (!layer.ok || !patch.ok) throw new Error("Invalid test configuration.");
  return strictConfig.encodeLayer(
    strictConfig.applyLayerPatch(layer.value, patch.value).layer
  );
}
