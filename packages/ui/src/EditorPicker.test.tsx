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
    const onChange = vi.fn(() => ({ ok: true } as const));
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
    const onChange = vi.fn(() => ({ ok: true } as const));
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

  test("confirming the pre-filled custom link pins it", async () => {
    // The draft is seeded from the selected editor's built-in template, so
    // accepting it unchanged used to compare equal and write nothing -- leaving
    // the action inheriting the Editor setting when the user had just pinned it.
    const onChange = vi.fn(() => ({ ok: true } as const));
    render(() => (
      <EditorPicker targets={targets} targetId="cursor" onChange={onChange} />
    ));

    await fireEvent.click(
      screen.getByRole("button", { name: "Customize link template" })
    );
    await fireEvent.keyDown(
      screen.getByRole("textbox", { name: "Custom link template" }),
      { key: "Enter" }
    );

    expect(onChange).toHaveBeenCalledWith({
      targetTemplate: targets.cursor.url,
      targetId: undefined,
    });
  });

  test("does not write an unchanged template a second time", async () => {
    const onChange = vi.fn(() => ({ ok: true } as const));
    render(() => (
      <EditorPicker
        targets={targets}
        targetTemplate="cursor://custom/${filePath}"
        onChange={onChange}
      />
    ));

    await fireEvent.click(
      screen.getByRole("button", { name: "Customize link template" })
    );
    await fireEvent.keyDown(
      screen.getByRole("textbox", { name: "Custom link template" }),
      { key: "Enter" }
    );

    expect(onChange).not.toHaveBeenCalled();
  });

  test("never offers an unknown editor id as a link template", async () => {
    // `DEFAULT_LAYER` pins `vscode`, which an app's own targets map does not
    // contain. Showing the bare id here pre-filled the custom-link input with
    // `vscode`, and confirming it stored that as a template that can never
    // build a URL.
    const onChange = vi.fn(() => ({ ok: true } as const));
    render(() => (
      <EditorPicker targets={targets} targetId="vscode" onChange={onChange} />
    ));

    expect(screen.queryByText("vscode")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Customize link template" })
    ).toBeNull();
  });

  test("keeps the custom template draft open when saving fails", async () => {
    // A `WriteResult`, which is what every real caller injects. The previous
    // `false` fixture is what let `EditorSetting`'s `!== false` check pass this
    // test while reading every real failure as success.
    const onChange = vi.fn(
      async () => ({ ok: false, reason: "quota" } as const)
    );
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
