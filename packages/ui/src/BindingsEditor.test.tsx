import { DEFAULT_LAYER, type Binding } from "@locator/shared";
import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, test, vi } from "vitest";
import { BindingsEditor } from "./BindingsEditor";

afterEach(cleanup);

const targets = {
  vscode: { label: "VS Code", url: "vscode://file/${filePath}" },
};

function Harness(props: {
  initial?: Binding[];
  onChange?: (next: Binding[] | undefined) => void;
}) {
  // The harness intentionally captures its one-time seed value.
  // eslint-disable-next-line solid/reactivity
  const initial = props.initial;
  const [value, setValue] = createSignal(
    initial ?? DEFAULT_LAYER.bindings ?? []
  );
  return (
    <BindingsEditor
      value={value()}
      targets={targets}
      onChange={(next) => {
        props.onChange?.(next);
        if (next) setValue(next);
        return { ok: true };
      }}
    />
  );
}

async function chooseDraftAction(arrowDowns: number) {
  await screen.getByRole("combobox", { name: "New action" }).click();
  const listbox = await screen.findByRole("listbox");
  for (let index = 0; index < arrowDowns; index += 1) {
    await fireEvent.keyDown(listbox, { key: "ArrowDown" });
  }
  await fireEvent.keyDown(listbox, { key: "Enter" });
}

describe("BindingsEditor", () => {
  test("adds modifier and toolbar bindings from independent sections", async () => {
    const onChange = vi.fn();
    render(() => <Harness onChange={onChange} />);

    expect(
      screen.getByRole("heading", { name: "Modifier + click" })
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Hover toolbar" })).toBeTruthy();

    await screen
      .getByRole("button", { name: "Add modifier + click binding" })
      .click();
    expect(screen.getByRole("combobox", { name: "New action" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeTruthy();
    expect(onChange).not.toHaveBeenCalled();
    await chooseDraftAction(2);
    expect(onChange).not.toHaveBeenCalled();
    await screen.getByRole("button", { name: "Confirm" }).click();
    expect(onChange.mock.calls.at(-1)?.[0][1]).toEqual({
      trigger: { kind: "modifier-click", modifiers: "alt+shift" },
      action: { kind: "copy-prompt" },
    });

    await screen
      .getByRole("button", { name: "Add hover toolbar binding" })
      .click();
    await chooseDraftAction(3);
    expect(onChange).toHaveBeenCalledTimes(1);
    await screen.getByRole("button", { name: "Confirm" }).click();
    expect(onChange.mock.calls.at(-1)?.[0].at(-1)).toEqual({
      trigger: { kind: "hover-toolbar" },
      action: { kind: "open-prompt", app: "cursor" },
    });
  });

  test("cancels a draft without changing bindings", async () => {
    const onChange = vi.fn();
    render(() => <Harness onChange={onChange} />);

    await screen
      .getByRole("button", { name: "Add hover toolbar binding" })
      .click();
    await chooseDraftAction(1);
    await screen.getByRole("button", { name: "Cancel" }).click();

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("combobox", { name: "New action" })).toBeNull();
  });

  test("does not allow removing the final modifier", async () => {
    const onChange = vi.fn();
    render(() => (
      <Harness
        initial={[
          {
            trigger: { kind: "modifier-click", modifiers: "alt" },
            action: { kind: "copy-path" },
          },
        ]}
        onChange={onChange}
      />
    ));

    await screen.getByRole("button", { name: /(Option|Alt)/ }).click();
    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen
        .getByRole("button", { name: /(Option|Alt)/ })
        .getAttribute("aria-pressed")
    ).toBe("true");
  });

  test("caps each section independently", () => {
    const toolbarBindings: Binding[] = Array.from({ length: 6 }, () => ({
      trigger: { kind: "hover-toolbar" },
      action: { kind: "copy-path" },
    }));
    render(() => <Harness initial={toolbarBindings} />);

    expect(
      (
        screen.getByRole("button", {
          name: "Add hover toolbar binding",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Add modifier + click binding",
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false);
  });
});
