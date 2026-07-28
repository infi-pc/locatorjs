import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { DEFAULT_LAYER } from "@locator/shared";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, test, vi } from "vitest";
import { LayeredOptionsEditor } from "./LayeredOptionsEditor";

afterEach(cleanup);

const ok = async () => ({ ok: true as const });

describe("LayeredOptionsEditor", () => {
  test("renders a single writable scope without tabs", () => {
    render(() => (
      <LayeredOptionsEditor
        layers={{ default: DEFAULT_LAYER, "user-origin": {} }}
        writeScopes={[
          { layer: "user-origin", label: "This origin", write: ok },
        ]}
        targets={{}}
      />
    ));

    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.getAllByText("Default editor").length).toBeGreaterThan(0);
  });

  test("renders exactly the two writable scopes as tabs", () => {
    render(() => (
      <LayeredOptionsEditor
        layers={{
          default: DEFAULT_LAYER,
          "user-extension": {},
          "user-origin": {},
        }}
        writeScopes={[
          {
            layer: "user-origin",
            label: "This site",
            write: ok,
            disabled: true,
            disabledReason: "Connect first.",
          },
          { layer: "user-extension", label: "All sites", write: ok },
        ]}
        targets={{}}
        defaultId="user-origin"
      />
    ));

    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(
      screen
        .getByRole("tab", { name: "All sites" })
        .getAttribute("aria-selected")
    ).toBe("true");
    expect(screen.queryByRole("tab", { name: /Team/ })).toBeNull();
  });

  test("shows provenance and reverts the current scope override", async () => {
    const write = vi.fn(ok);
    const { unmount } = render(() => (
      <LayeredOptionsEditor
        layers={{
          default: DEFAULT_LAYER,
          team: { projectPath: "/repo/team" },
          "user-origin": {},
        }}
        writeScopes={[{ layer: "user-origin", label: "This origin", write }]}
        targets={{}}
      />
    ));
    expect(screen.getAllByText("Team").length).toBeGreaterThan(0);
    unmount();

    render(() => (
      <LayeredOptionsEditor
        layers={{
          default: DEFAULT_LAYER,
          team: { projectPath: "/repo/team" },
          "user-origin": { projectPath: "/repo/custom" },
        }}
        writeScopes={[{ layer: "user-origin", label: "This origin", write }]}
        targets={{}}
      />
    ));
    await screen.getByRole("button", { name: "Revert Project path" }).click();
    expect(write).toHaveBeenCalledWith({ projectPath: undefined });
  });

  test("shows path validation and layer inspector", async () => {
    const [values, setValues] = createSignal({});
    const write = async (patch: Record<string, unknown>) => {
      setValues((current) => ({ ...current, ...patch }));
      return { ok: true as const };
    };
    render(() => (
      <LayeredOptionsEditor
        layers={{ default: DEFAULT_LAYER, "user-extension": values() }}
        writeScopes={[{ layer: "user-extension", label: "All sites", write }]}
        targets={{}}
      />
    ));

    await fireEvent.change(screen.getByPlaceholderText("From"), {
      target: { value: "[" },
    });
    expect(
      await screen.findByText("From must be a valid regular expression.")
    ).toBeTruthy();
    expect(screen.getByText("View layers")).toBeTruthy();
  });

  test("renders promotional hints below the form", () => {
    render(() => (
      <LayeredOptionsEditor
        layers={{ default: DEFAULT_LAYER, "user-origin": {} }}
        writeScopes={[
          { layer: "user-origin", label: "This origin", write: ok },
        ]}
        targets={{}}
        promos={[
          {
            text: "Keep settings everywhere.",
            href: "https://example.com",
            linkLabel: "Install extension",
          },
        ]}
      />
    ));

    expect(screen.getByText("Keep settings everywhere.")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Install extension" })
    ).toBeTruthy();
  });
});
