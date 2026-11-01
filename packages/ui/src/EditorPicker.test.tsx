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
  test("saves a Paseo link with the visible button and waits for persistence", async () => {
    const template =
      "paseo://compose?cwd=${projectPath}&file=${filePath}&line=${line}&column=${column}";
    let finishSave!: (result: { ok: true }) => void;
    const onChange = vi.fn(
      () => new Promise<{ ok: true }>((resolve) => (finishSave = resolve))
    );
    const onStatusChange = vi.fn();
    render(() => (
      <EditorPicker
        targets={targets}
        value={{ kind: "target", id: "cursor" }}
        onChange={onChange}
        onStatusChange={onStatusChange}
      />
    ));

    await fireEvent.click(
      screen.getByRole("button", { name: "Customize link template" })
    );
    const input = screen.getByRole("textbox", {
      name: "Custom link template",
    });
    await fireEvent.input(input, { target: { value: template } });
    expect(onStatusChange).toHaveBeenLastCalledWith("editing");
    await fireEvent.click(screen.getByRole("button", { name: "Save link" }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith({
      kind: "template",
      template,
    });
    expect(onStatusChange).toHaveBeenLastCalledWith("saving");
    expect((input as HTMLInputElement).disabled).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Saving…" }) as HTMLButtonElement)
        .disabled
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement)
        .disabled
    ).toBe(true);

    finishSave({ ok: true });
    await vi.waitFor(() => {
      expect(onStatusChange).toHaveBeenLastCalledWith("idle");
      expect(screen.queryByRole("textbox")).toBeNull();
    });
  });

  test("customizes a selected editor template only after the draft is committed", async () => {
    const onChange = vi.fn(() => ({ ok: true } as const));
    render(() => (
      <EditorPicker
        targets={targets}
        value={{ kind: "target", id: "cursor" }}
        onChange={onChange}
      />
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
      kind: "template",
      template: "cursor://custom/${filePath}:${line}",
    });
  });

  test.each(["Escape", "Cancel"])(
    "cancels a custom template draft with %s",
    async (action) => {
      const onChange = vi.fn(() => ({ ok: true } as const));
      render(() => (
        <EditorPicker
          targets={targets}
          value={{ kind: "target", id: "cursor" }}
          onChange={onChange}
        />
      ));

      await fireEvent.click(
        screen.getByRole("button", { name: "Customize link template" })
      );
      const input = screen.getByRole("textbox", {
        name: "Custom link template",
      });
      await fireEvent.input(input, { target: { value: "changed://template" } });
      if (action === "Escape")
        await fireEvent.keyDown(input, { key: "Escape" });
      else
        await fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(onChange).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("textbox", { name: "Custom link template" })
      ).toBeNull();
      expect(screen.getByText(targets.cursor.url)).toBeTruthy();
    }
  );

  test("confirming the pre-filled custom link pins it", async () => {
    // The draft is seeded from the selected editor's built-in template, so
    // accepting it unchanged used to compare equal and write nothing -- leaving
    // the action inheriting the Editor setting when the user had just pinned it.
    const onChange = vi.fn(() => ({ ok: true } as const));
    render(() => (
      <EditorPicker
        targets={targets}
        value={{ kind: "target", id: "cursor" }}
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

    expect(onChange).toHaveBeenCalledWith({
      kind: "template",
      template: targets.cursor.url,
    });
  });

  test("does not write an unchanged template a second time", async () => {
    const onChange = vi.fn(() => ({ ok: true } as const));
    render(() => (
      <EditorPicker
        targets={targets}
        value={{
          kind: "template",
          template: "cursor://custom/${filePath}",
        }}
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
      <EditorPicker
        targets={targets}
        value={{ kind: "target", id: "vscode" }}
        onChange={onChange}
      />
    ));

    expect(screen.queryByText("vscode")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Customize link template" })
    ).toBeNull();
  });

  test.each(["failure", "rejection"])(
    "keeps the draft and explains a save %s",
    async (failure) => {
      // A `WriteResult`, which is what every real caller injects. The previous
      // `false` fixture is what let `EditorSetting`'s `!== false` check pass this
      // test while reading every real failure as success.
      const onChange = vi.fn(
        async () => ({ ok: false, reason: "quota" } as const)
      );
      if (failure === "rejection")
        onChange.mockRejectedValue(new Error("Storage unavailable"));
      render(() => (
        <EditorPicker
          targets={targets}
          value={{ kind: "target", id: "cursor" }}
          onChange={onChange}
        />
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
      expect(screen.getByRole("alert").textContent).toContain("Could not save");
      expect(
        (screen.getByRole("button", { name: "Save link" }) as HTMLButtonElement)
          .disabled
      ).toBe(false);
    }
  );

  test("rejects a custom template without a URL scheme", async () => {
    const onChange = vi.fn(() => ({ ok: true } as const));
    render(() => (
      <EditorPicker
        targets={targets}
        value={{ kind: "target", id: "cursor" }}
        onChange={onChange}
      />
    ));

    await fireEvent.click(
      screen.getByRole("button", { name: "Customize link template" })
    );
    const input = screen.getByRole("textbox", {
      name: "Custom link template",
    });
    await fireEvent.input(input, { target: { value: "missing-scheme" } });
    await fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("static scheme");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  test("treats an empty custom draft as cancel, preserving the editor", async () => {
    const onChange = vi.fn(() => ({ ok: true } as const));
    render(() => (
      <EditorPicker
        targets={targets}
        value={{ kind: "target", id: "cursor" }}
        onChange={onChange}
      />
    ));

    await fireEvent.click(
      screen.getByRole("button", { name: "Customize link template" })
    );
    const input = screen.getByRole("textbox", {
      name: "Custom link template",
    });
    await fireEvent.input(input, { target: { value: "  " } });
    await fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.getByText(targets.cursor.url)).toBeTruthy();
  });
});
