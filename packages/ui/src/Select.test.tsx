import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Select } from "./Select";

afterEach(cleanup);

describe("Select", () => {
  test("registers a caller-provided trigger id with the select machine", async () => {
    render(() => (
      <Select
        id="editor-trigger"
        aria-label="Editor"
        items={[{ value: "cursor", label: "Cursor" }]}
        value="cursor"
        onChange={() => undefined}
      />
    ));

    const trigger = screen.getByRole("combobox", { name: "Editor" });
    expect(trigger.id).toBe("editor-trigger");
    await fireEvent.click(trigger);
    expect(await screen.findByRole("listbox")).toBeTruthy();
  });

  test("selects an option with the standard keyboard listbox interaction", async () => {
    const onChange = vi.fn();
    render(() => (
      <Select
        aria-label="Editor"
        items={[
          { value: "cursor", label: "Cursor" },
          { value: "vscode", label: "VSCode" },
        ]}
        value="cursor"
        onChange={onChange}
      />
    ));

    const trigger = screen.getByRole("combobox", { name: "Editor" });
    await fireEvent.click(trigger);

    const listbox = await screen.findByRole("listbox");
    expect(listbox).toBeTruthy();
    await fireEvent.keyDown(listbox, {
      key: "ArrowDown",
      code: "ArrowDown",
      keyCode: 40,
    });
    await fireEvent.keyDown(listbox, {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
    });
    expect(onChange).toHaveBeenCalledWith("vscode");
  });

  test("renders independent icons in the trigger and open menu", async () => {
    render(() => (
      <Select
        aria-label="Action"
        items={[
          {
            value: "copy-path",
            label: "Copy path",
            icon: () => <span data-testid="action-icon" />,
          },
        ]}
        value="copy-path"
        onChange={() => undefined}
      />
    ));

    const icons = screen.getAllByTestId("action-icon");
    expect(icons).toHaveLength(2);
    expect(icons[0]).not.toBe(icons[1]);
    await screen.getByRole("combobox", { name: "Action" }).click();
    expect(screen.getAllByTestId("action-icon")).toHaveLength(2);
  });
});
