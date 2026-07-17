import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, test, vi } from "vitest";
import { EditorPicker } from "./EditorPicker";

const targets = {
  cursor: {
    label: "Cursor",
    url: "cursor://file/${projectPath}${filePath}:${line}:${column}",
  },
};

afterEach(cleanup);

describe("EditorPicker", () => {
  test("customizes a selected editor template only after the draft is committed", async () => {
    const onChange = vi.fn();
    render(() => (
      <EditorPicker targets={targets} targetId="cursor" onChange={onChange} />
    ));

    expect(screen.getByText(targets.cursor.url)).toBeTruthy();
    await fireEvent.click(
      screen.getByRole("button", { name: "Customize link template" })
    );

    const input = screen.getByRole("textbox", {
      name: "Custom link template",
    }) as HTMLInputElement;
    expect(input.value).toBe(targets.cursor.url);
    expect(onChange).not.toHaveBeenCalled();

    await fireEvent.input(input, {
      target: { value: "cursor://custom/${filePath}:${line}" },
    });
    await fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith({
      targetTemplate: "cursor://custom/${filePath}:${line}",
      targetId: undefined,
    });
  });

  test("cancels a custom template draft with Escape", async () => {
    const onChange = vi.fn();
    render(() => (
      <EditorPicker targets={targets} targetId="cursor" onChange={onChange} />
    ));

    await fireEvent.click(
      screen.getByRole("button", { name: "Customize link template" })
    );
    const input = screen.getByRole("textbox", {
      name: "Custom link template",
    });
    await fireEvent.input(input, { target: { value: "changed://template" } });
    await fireEvent.keyDown(input, { key: "Escape" });

    expect(onChange).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("textbox", { name: "Custom link template" })
    ).toBeNull();
    expect(screen.getByText(targets.cursor.url)).toBeTruthy();
  });

  test("keeps the custom template draft open when saving fails", async () => {
    const onChange = vi.fn(async () => false);
    render(() => (
      <EditorPicker targets={targets} targetId="cursor" onChange={onChange} />
    ));

    await fireEvent.click(
      screen.getByRole("button", { name: "Customize link template" })
    );
    const input = screen.getByRole("textbox", {
      name: "Custom link template",
    });
    await fireEvent.input(input, {
      target: { value: "cursor://failed/${filePath}" },
    });
    await fireEvent.keyDown(input, { key: "Enter" });

    expect(
      (
        (await screen.findByRole("textbox", {
          name: "Custom link template",
        })) as HTMLInputElement
      ).value
    ).toBe("cursor://failed/${filePath}");
  });
});
