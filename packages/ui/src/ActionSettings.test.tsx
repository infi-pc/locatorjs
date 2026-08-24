import {
  DEFAULT_LAYER,
  type Binding,
  type LocatorOptions,
} from "@locator/shared";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, test, vi } from "vitest";
import { ActionSettings } from "./ActionSettings";

afterEach(cleanup);

const targets = {
  vscode: { label: "VS Code", url: "vscode://file/${filePath}" },
  webstorm: { label: "WebStorm", url: "webstorm://file/${filePath}" },
};

function Harness(props: {
  initial?: LocatorOptions;
  inspectorMount?: Node;
  onWrite?: (patch: Partial<LocatorOptions>) => void;
  onTry?: (action: import("@locator/shared").BindingAction) => void;
}) {
  // The test harness intentionally captures its one-time seed value.
  // eslint-disable-next-line solid/reactivity -- the harness intentionally captures its seed once.
  const [values, setValues] = createSignal<LocatorOptions>(props.initial ?? {});
  return (
    <ActionSettings
      layers={{ default: DEFAULT_LAYER, "user-origin": values() }}
      scopes={[
        {
          layer: "user-origin",
          label: "This origin",
          write: async (patch) => {
            props.onWrite?.(patch);
            setValues((current) => ({ ...current, ...patch }));
            return { ok: true as const };
          },
        },
      ]}
      targets={targets}
      inspectorMount={props.inspectorMount}
      onTryAction={(action) => props.onTry?.(action)}
    />
  );
}

async function chooseDraftAction(arrowDowns: number) {
  await screen.getByRole("combobox", { name: "Action" }).click();
  const listbox = await screen.findByRole("listbox");
  for (let index = 0; index < arrowDowns; index += 1) {
    await fireEvent.keyDown(listbox, { key: "ArrowDown" });
  }
  await fireEvent.keyDown(listbox, { key: "Enter" });
}

describe("ActionSettings", () => {
  test("opens the selected interaction in a dismissible dialog", async () => {
    render(() => <Harness />);

    expect(screen.queryByRole("tab", { name: "Cards" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Matrix" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Map" })).toBeNull();
    expect(screen.getByRole("heading", { name: "Shortcuts" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Hover toolbar" })).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: /^Edit action/ })
    ).toHaveLength(4);
    expect(screen.getByLabelText(/(Option|Alt) \+ Click/)).toBeTruthy();
    expect(screen.getAllByText("Open in editor")).toHaveLength(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    const firstAction = screen.getByRole("button", {
      name: "Edit action 1: Open in editor",
    });
    expect(firstAction.getAttribute("aria-pressed")).toBe("false");

    await firstAction.click();
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(firstAction.getAttribute("aria-pressed")).toBe("true");
    expect(
      screen.getByRole("heading", { name: "Open in editor" })
    ).toBeTruthy();
    expect(screen.getByLabelText("Selected interaction editor")).toBeTruthy();

    await fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(firstAction.getAttribute("aria-pressed")).toBe("false");

    await firstAction.click();
    await screen
      .getByRole("button", { name: "Close interaction editor" })
      .click();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(firstAction.getAttribute("aria-pressed")).toBe("false");

    await firstAction.click();
    const backdrop = screen.getByRole("dialog").parentElement;
    expect(backdrop).toBeTruthy();
    await fireEvent.pointerDown(backdrop!);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(firstAction.getAttribute("aria-pressed")).toBe("false");
  });

  test("mounts the editor drawer inside a supplied host", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    render(() => <Harness inspectorMount={host} />);

    await screen
      .getByRole("button", { name: "Edit action 1: Open in editor" })
      .click();

    const dialog = screen.getByRole("dialog");
    expect(host.contains(dialog)).toBe(true);
    expect(dialog.parentElement?.parentElement?.parentElement).toBe(host);
  });

  test("pinning an editor on an action writes only that action", async () => {
    const write = vi.fn(async (patch: Partial<LocatorOptions>) => {
      void patch;
      return { ok: true as const };
    });
    render(() => (
      <ActionSettings
        layers={{ default: DEFAULT_LAYER }}
        scopes={[{ layer: "user-origin", label: "This origin", write }]}
        targets={targets}
      />
    ));

    await screen
      .getByRole("button", { name: "Edit action 1: Open in editor" })
      .click();
    // Scoped to the drawer: the surface also carries the global Editor field.
    const dialog = screen.getByRole("dialog");
    await within(dialog).getByRole("combobox", { name: "Editor" }).click();
    await fireEvent.click(
      await screen.findByRole("option", { name: /WebStorm/ })
    );

    expect(write).toHaveBeenLastCalledWith({
      bindings: expect.arrayContaining([
        expect.objectContaining({
          action: { kind: "open-editor", targetId: "webstorm" },
        }),
      ]),
      mouseModifiers: undefined,
    });
    // The action carries the override; the global setting is left alone.
    const writtenKeys = write.mock.calls.flatMap(([patch]) =>
      Object.keys(patch)
    );
    expect(writtenKeys).not.toContain("targetId");
    expect(writtenKeys).not.toContain("editor");
  });

  test("an action can be handed back to the global Editor setting", async () => {
    const write = vi.fn(async (patch: Partial<LocatorOptions>) => {
      void patch;
      return { ok: true as const };
    });
    const pinned: Binding[] = [
      {
        trigger: { kind: "modifier-click", modifiers: "alt" },
        action: { kind: "open-editor", targetId: "webstorm" },
      },
    ];
    render(() => (
      <ActionSettings
        layers={{ default: DEFAULT_LAYER, "user-origin": { bindings: pinned } }}
        scopes={[{ layer: "user-origin", label: "This origin", write }]}
        targets={targets}
      />
    ));

    await screen
      .getByRole("button", { name: "Edit action 1: Open in WebStorm" })
      .click();
    const dialog = screen.getByRole("dialog");
    await within(dialog).getByRole("combobox", { name: "Editor" }).click();
    await fireEvent.click(
      await screen.findByRole("option", { name: /^Editor setting/ })
    );

    expect(write).toHaveBeenLastCalledWith({
      bindings: [
        {
          trigger: { kind: "modifier-click", modifiers: "alt" },
          action: { kind: "open-editor" },
        },
      ],
      mouseModifiers: undefined,
    });
  });

  test("shows an icon for the selected action and every action choice", async () => {
    render(() => <Harness />);

    await screen
      .getByRole("button", { name: "Edit action 1: Open in editor" })
      .click();
    const trigger = screen.getByRole("combobox", { name: "Action" });
    expect(trigger.querySelectorAll("svg, img").length).toBeGreaterThanOrEqual(
      2
    );

    await trigger.click();
    const listbox = await screen.findByRole("listbox");
    const options = listbox.querySelectorAll('[role="option"]');
    expect(options).toHaveLength(6);
    for (const option of options) {
      expect(option.querySelector("svg, img")).toBeTruthy();
    }
    expect(trigger.querySelectorAll("svg, img").length).toBeGreaterThanOrEqual(
      2
    );
  });

  test("moves infrequent settings and configuration sources into Advanced", async () => {
    render(() => (
      <Harness
        initial={{
          projectPath: "/repo/app",
          replacePath: { from: "/repo", to: "/workspace" },
          debugMode: true,
        }}
      />
    ));

    await screen.getByRole("button", { name: "Advanced settings" }).click();
    expect(screen.getByRole("heading", { name: "Advanced" })).toBeTruthy();
    expect(screen.getByText("Project path")).toBeTruthy();
    expect(screen.getByText("Path replace")).toBeTruthy();
    expect(screen.getByText("Configuration sources")).toBeTruthy();
  });

  test("dismisses the settings menu on an outside pointer down", async () => {
    render(() => <Harness />);

    const trigger = screen.getByLabelText("Settings menu");
    const menu = trigger.closest("details") as HTMLDetailsElement;
    await trigger.click();
    expect(menu.open).toBe(true);
    expect(
      screen.getByRole("button", { name: "Advanced settings" })
    ).toBeTruthy();

    await fireEvent.pointerDown(screen.getByLabelText("Interaction map"));
    expect(menu.open).toBe(false);
  });

  test("drafts a full hover-only prompt action and only persists it on confirm", async () => {
    const onWrite = vi.fn();
    render(() => <Harness onWrite={onWrite} />);

    await screen
      .getByRole("button", { name: "Add hover toolbar action" })
      .click();
    expect(screen.getByRole("combobox", { name: "Action" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Copy AI prompt" })).toBeNull();
    expect(onWrite).not.toHaveBeenCalled();

    await chooseDraftAction(2);
    await screen.getByRole("textbox", { name: "Prompt template" }).focus();
    await fireEvent.input(
      screen.getByRole("textbox", { name: "Prompt template" }),
      { target: { value: "Explain ${filePath}" } }
    );
    await fireEvent.blur(
      screen.getByRole("textbox", { name: "Prompt template" })
    );
    expect(
      (
        screen.getByRole("textbox", {
          name: "Prompt template",
        }) as HTMLTextAreaElement
      ).value
    ).toBe("Explain ${filePath}");
    expect(onWrite).not.toHaveBeenCalled();
    await screen.getByRole("button", { name: "Add" }).click();

    expect(onWrite).toHaveBeenLastCalledWith(
      expect.objectContaining({
        bindings: expect.arrayContaining([
          {
            trigger: { kind: "hover-toolbar" },
            action: {
              kind: "copy-prompt",
              template: "Explain ${filePath}",
            },
          },
        ]),
      })
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await screen
      .getByRole("button", { name: "Edit action 5: Copy AI prompt" })
      .click();
    expect(
      screen.getByRole("heading", { name: "Copy AI prompt" })
    ).toBeTruthy();

    expect(
      screen.getByRole("textbox", { name: "Prompt template" })
    ).toBeTruthy();
    expect(
      (
        screen.getByRole("textbox", {
          name: "Prompt template",
        }) as HTMLTextAreaElement
      ).value
    ).toBe("Explain ${filePath}");
    // A prompt action has no destination to pick, so the drawer shows no
    // editor field — the global one on the surface behind it is not it.
    expect(
      within(screen.getByRole("dialog")).queryByRole("combobox", {
        name: "Editor",
      })
    ).toBeNull();
    expect(screen.queryByRole("button", { name: /(Option|Alt)/ })).toBeNull();

    await screen.getByRole("button", { name: "Remove" }).click();
    expect(
      screen.getAllByRole("button", { name: /^Edit action/ })
    ).toHaveLength(4);
  });

  test("adds modifier actions before toolbar items with the first unused shortcut", async () => {
    const onWrite = vi.fn();
    render(() => <Harness onWrite={onWrite} />);

    await screen
      .getByRole("button", { name: "Add modifier + click action" })
      .click();
    expect(onWrite).not.toHaveBeenCalled();
    await chooseDraftAction(1);
    expect(onWrite).not.toHaveBeenCalled();
    await screen.getByRole("button", { name: "Add" }).click();

    const written = onWrite.mock.calls.at(-1)?.[0].bindings;
    expect(written?.[1]).toEqual({
      trigger: { kind: "modifier-click", modifiers: "alt+shift" },
      action: { kind: "copy-path" },
    });
    expect(written?.[2]?.trigger.kind).toBe("hover-toolbar");
    expect(
      screen.getByLabelText(/(Option|Alt) \+ (Shift|⇧ Shift) \+ Click/)
    ).toBeTruthy();
  });

  test("shows duplicate validation and keeps a modifier trigger required", async () => {
    const onWrite = vi.fn();
    render(() => (
      <Harness
        onWrite={onWrite}
        initial={{
          bindings: [
            {
              trigger: { kind: "modifier-click", modifiers: "alt" },
              action: { kind: "copy-path" },
            },
            {
              trigger: { kind: "modifier-click", modifiers: "alt" },
              action: { kind: "show-tree" },
            },
          ],
        }}
      />
    ));

    expect(screen.getAllByTitle("Duplicate shortcut")).toHaveLength(2);
    await screen
      .getByRole("button", { name: "Edit action 1: Copy path" })
      .click();
    await screen.getByRole("button", { name: /(Option|Alt)/ }).click();
    expect(onWrite).not.toHaveBeenCalled();
    expect(
      screen
        .getByRole("button", { name: /(Option|Alt)/ })
        .getAttribute("aria-pressed")
    ).toBe("true");
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  test("clears only a real bindings override with Use inherited", async () => {
    render(() => (
      <Harness
        initial={{
          bindings: [
            {
              trigger: { kind: "hover-toolbar" },
              action: { kind: "copy-path" },
            },
          ],
        }}
      />
    ));

    expect(
      screen.getAllByRole("button", { name: /^Edit action/ })
    ).toHaveLength(1);
    await screen.getByRole("button", { name: "Use inherited actions" }).click();
    expect(
      screen.getAllByRole("button", { name: /^Edit action/ })
    ).toHaveLength(4);
    expect(
      screen.queryByRole("button", { name: "Use inherited actions" })
    ).toBeNull();
  });

  test("enforces six actions per section independently", async () => {
    const sixToolbar: Binding[] = Array.from({ length: 6 }, (_, index) => ({
      trigger: { kind: "hover-toolbar" },
      action:
        index % 2
          ? ({ kind: "show-tree" } as const)
          : ({ kind: "copy-path" } as const),
    }));
    render(() => <Harness initial={{ bindings: sixToolbar }} />);
    expect(
      (
        screen.getByRole("button", {
          name: "Add hover toolbar action",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Add modifier + click action",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false);
  });

  test("announces write failures", async () => {
    render(() => (
      <ActionSettings
        layers={{ default: DEFAULT_LAYER }}
        scopes={[
          {
            layer: "user-origin",
            label: "This origin",
            write: async () => ({
              ok: false as const,
              reason: "quota" as const,
            }),
          },
        ]}
        targets={targets}
      />
    ));
    await screen
      .getByRole("button", { name: "Add hover toolbar action" })
      .click();
    await chooseDraftAction(2);
    await screen.getByRole("button", { name: "Add" }).click();
    expect(screen.getByRole("alert").textContent).toContain("storage is full");
  });

  test("keeps the toolbar add control outside the real toolbar frame", () => {
    render(() => <Harness />);
    const toolbar = screen.getByLabelText("Configured hover toolbar");
    const add = screen.getByRole("button", {
      name: "Add hover toolbar action",
    });
    expect(toolbar.contains(add)).toBe(false);
  });

  test("tries only the selected action", async () => {
    const onTry = vi.fn();
    render(() => <Harness onTry={onTry} />);
    await screen
      .getByRole("button", { name: "Edit action 4: Copy path" })
      .click();
    await screen.getByRole("button", { name: "Try this action" }).click();
    expect(onTry).toHaveBeenCalledWith({ kind: "copy-path" });
  });
});
