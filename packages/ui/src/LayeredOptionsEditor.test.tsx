import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { DEFAULT_LAYER } from "@locator/shared";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, test, vi } from "vitest";
import { LayeredOptionsEditor } from "./LayeredOptionsEditor";

afterEach(cleanup);

describe("LayeredOptionsEditor", () => {
  test("falls back to the first available layer when the requested tab is disabled", () => {
    render(() => (
      <LayeredOptionsEditor
        tabs={[
          {
            layer: "user-origin",
            label: "This origin",
            values: {},
            disabled: true,
            disabledReason: "Connect to a page running LocatorJS.",
          },
          {
            layer: "user-extension",
            label: "Extension",
            values: {},
          },
          { layer: "default", label: "Defaults", values: DEFAULT_LAYER },
        ]}
        targets={{}}
        defaultId="user-origin"
      />
    ));

    expect(
      screen
        .getByRole("tab", { name: "Extension" })
        .getAttribute("aria-selected")
    ).toBe("true");
    expect(
      screen.getByRole("tab", { name: "This origin" }).hasAttribute("disabled")
    ).toBe(true);
    expect(screen.queryByRole("tab", { name: /Defaults/ })).toBeNull();
  });

  test("reverts an override with a source-aware accessible action", async () => {
    const write = vi.fn(async () => ({ ok: true as const }));
    render(() => (
      <LayeredOptionsEditor
        tabs={[
          {
            layer: "default",
            label: "Defaults",
            values: { ...DEFAULT_LAYER, projectPath: "/repo/default" },
          },
          {
            layer: "user-extension",
            label: "Extension",
            values: { projectPath: "/repo/custom" },
            write,
          },
        ]}
        targets={{}}
        defaultId="user-extension"
      />
    ));

    const revert = screen.getByRole("button", {
      name: "Revert Project path to default: /repo/default",
    });
    expect(screen.queryByText("from defaults")).toBeNull();
    expect(screen.getByRole("checkbox", { name: "Debug mode" })).toBeTruthy();
    await revert.click();
    expect(write).toHaveBeenCalledWith({ projectPath: undefined });
  });

  test("shows inline feedback for an invalid path replacement regex", async () => {
    const [values, setValues] = createSignal({});
    const write = async (patch: Record<string, unknown>) => {
      setValues((current) => ({ ...current, ...patch }));
      return { ok: true as const };
    };
    render(() => (
      <LayeredOptionsEditor
        tabs={[
          { layer: "default", label: "Defaults", values: DEFAULT_LAYER },
          {
            layer: "user-extension",
            label: "Extension",
            values: values(),
            write,
          },
        ]}
        targets={{}}
        defaultId="user-extension"
      />
    ));

    await fireEvent.change(screen.getByPlaceholderText("From"), {
      target: { value: "[" },
    });
    expect(
      await screen.findByText("From must be a valid regular expression.")
    ).toBeTruthy();
  });

  test("shows the intro switch on when the inherited value is unset", () => {
    render(() => (
      <LayeredOptionsEditor
        tabs={[
          { layer: "default", label: "Defaults", values: DEFAULT_LAYER },
          {
            layer: "user-origin",
            label: "This origin",
            values: {},
            write: async () => ({ ok: true as const }),
          },
        ]}
        targets={{}}
        defaultId="user-origin"
      />
    ));

    expect(
      (
        screen.getByRole("checkbox", {
          name: "Show intro again",
        }) as HTMLInputElement
      ).checked
    ).toBe(true);
  });
});
