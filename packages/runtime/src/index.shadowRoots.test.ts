// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getShadowRoots } from "./functions/shadowRoots";

vi.mock("./initRuntime", () => ({ initRuntime: vi.fn() }));

import { setup } from "./index";

describe("setup shadow-root tracking", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  test("tracks a closed root created after disabled setup", () => {
    const beforeHost = document.createElement("div");
    const before = beforeHost.attachShadow({ mode: "closed" });
    document.body.append(beforeHost);

    expect(setup({ disabled: true })).toEqual({ ok: true });

    const afterHost = document.createElement("div");
    const after = afterHost.attachShadow({ mode: "closed" });
    document.body.append(afterHost);

    expect(setup({ disabled: false })).toEqual({ ok: true });
    expect(beforeHost.shadowRoot).toBeNull();
    expect(afterHost.shadowRoot).toBeNull();
    expect(getShadowRoots()).not.toContain(before);
    expect(getShadowRoots()).toContain(after);
  });
});
