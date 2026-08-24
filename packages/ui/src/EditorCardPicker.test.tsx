import { cleanup, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, test } from "vitest";
import { EditorCardPicker } from "./EditorCardPicker";

afterEach(cleanup);

describe("EditorCardPicker", () => {
  test("uses independent toggle buttons instead of an incomplete radio group", () => {
    render(() => (
      <EditorCardPicker
        targets={{ cursor: { label: "Cursor", url: "cursor://${filePath}" } }}
        targetId="cursor"
        onSelect={() => undefined}
      />
    ));

    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Cursor" })
        .getAttribute("aria-pressed")
    ).toBe("true");
    expect(
      screen
        .getByRole("button", { name: "Custom link" })
        .getAttribute("aria-pressed")
    ).toBe("false");
  });
});
