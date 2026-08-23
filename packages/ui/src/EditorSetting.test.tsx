import { cleanup, fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { LocatorLayer, LocatorOptions } from "@locator/shared";
import { EditorSetting } from "./EditorSetting";

const targets = {
  cursor: {
    label: "Cursor",
    url: "cursor://file/${projectPath}${filePath}:${line}:${column}",
  },
};

const layers: Partial<Record<LocatorLayer, LocatorOptions>> = {
  "user-origin": { editor: { targetId: "cursor" } },
};

afterEach(cleanup);

async function editTemplate(value: string) {
  await fireEvent.click(
    screen.getByRole("button", { name: "Customize link template" })
  );
  const input = screen.getByRole("textbox", { name: "Custom link template" });
  await fireEvent.input(input, { target: { value } });
  await fireEvent.keyDown(input, { key: "Enter" });
}

describe("EditorSetting", () => {
  test("keeps the draft on screen when the write fails", async () => {
    // The picker's contract is a `WriteResult`. Comparing it with `!== false`
    // read `{ ok: false }` as success, closed the input, and discarded the
    // typed template -- exactly what keeping the draft open exists to prevent.
    const write = vi.fn(async () => ({ ok: false, reason: "quota" } as const));
    render(() => (
      <EditorSetting
        layers={layers}
        layer="user-origin"
        targets={targets}
        write={write}
      />
    ));

    await editTemplate("myeditor://file/${filePath}");

    expect(write).toHaveBeenCalledWith({
      editor: {
        targetTemplate: "myeditor://file/${filePath}",
        targetId: undefined,
      },
    });
    expect(
      (
        (await screen.findByRole("textbox", {
          name: "Custom link template",
        })) as HTMLInputElement
      ).value
    ).toBe("myeditor://file/${filePath}");
  });

  test("closes the draft when the write succeeds", async () => {
    const write = vi.fn(async () => ({ ok: true } as const));
    render(() => (
      <EditorSetting
        layers={layers}
        layer="user-origin"
        targets={targets}
        write={write}
      />
    ));

    await editTemplate("myeditor://file/${filePath}");

    expect(
      screen.queryByRole("textbox", { name: "Custom link template" })
    ).toBeNull();
  });
});
