import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Select } from "./Select";

afterEach(cleanup);

describe("Select", () => {
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
});
