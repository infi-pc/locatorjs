import { cleanup, render, screen } from "@solidjs/testing-library";
import { afterEach, describe, expect, test } from "vitest";
import { Field } from "./Field";

afterEach(cleanup);

describe("Field labels", () => {
  test("labels a named form control", () => {
    render(() => (
      <Field label="Project path" controlId="project-path">
        <input id="project-path" />
      </Field>
    ));

    expect(screen.getByRole("textbox", { name: "Project path" })).toBeTruthy();
  });

  test("labels the field group when there is no single control", () => {
    render(() => (
      <Field label="Advanced behavior">
        <button type="button">Configure</button>
      </Field>
    ));

    expect(
      screen.getByRole("group", { name: "Advanced behavior" })
    ).toBeTruthy();
    expect(document.querySelector("label:not([for])")).toBeNull();
  });
});
