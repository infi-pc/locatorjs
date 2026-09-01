import { afterEach, describe, expect, test, vi } from "vitest";
import { setup } from "./index.server";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("server setup", () => {
  test("reports a rejected configuration, like the browser entry", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const result = setup({
      editor: { kind: "template", template: "javascript:alert(1)" },
    });

    expect(result.ok).toBe(false);
    expect(consoleError).toHaveBeenCalledTimes(1);
    const [message] = consoleError.mock.calls[0] as [string];
    expect(message).toContain("No part of it was applied");
    expect(message).toContain("/editor/template");
    expect(message).toContain("unsafe-template");
  });

  test("stays silent and inert when the configuration is accepted", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    expect(setup({ projectPath: "/valid" })).toEqual({ ok: true });
    expect(consoleError).not.toHaveBeenCalled();
  });
});
