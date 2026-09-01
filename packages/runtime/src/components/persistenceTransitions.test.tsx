// @vitest-environment jsdom

import { strictConfig } from "@locator/shared";
import { type JSX } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { DisableConfirmation } from "./DisableConfirmation";
import { IntroInfo } from "./IntroInfo";
import { Options } from "./Options";
import { WelcomeScreen } from "./WelcomeScreen";

const mocks = vi.hoisted(() => ({
  clearUserOrigin: vi.fn(),
  setUiState: vi.fn(),
  setUserOrigin: vi.fn(),
}));

const allTargets = strictConfig.targetRegistryView(
  strictConfig.BUILT_IN_TARGETS
);
const effective = strictConfig.effectiveOptions(
  strictConfig.resolveConfig(
    { default: strictConfig.DEFAULT_LAYER },
    strictConfig.BUILT_IN_TARGETS
  )
);
const defaultLayer = strictConfig.encodeLayer(strictConfig.DEFAULT_LAYER);

vi.mock("../functions/isExtension", () => ({ isExtension: () => true }));
vi.mock("../functions/optionsContext", () => ({
  useOptions: () => ({
    allTargets: () => allTargets,
    clearUserOrigin: mocks.clearUserOrigin,
    effective: () => effective,
    editorWithheld: () => false,
    layers: () => ({ default: defaultLayer }),
    provenance: () => ({}),
    setUiState: mocks.setUiState,
    setUserOrigin: mocks.setUserOrigin,
    targetRegistry: () => strictConfig.BUILT_IN_TARGETS,
    uiState: () => ({}),
  }),
}));

const disposers: Array<() => void> = [];

function mount(subject: () => JSX.Element) {
  const host = document.createElement("div");
  document.body.append(host);
  disposers.push(render(subject, host));
}

function button(label: string): HTMLButtonElement {
  const match = [...document.querySelectorAll("button")].find(
    (candidate) => candidate.textContent?.trim() === label
  );
  if (!(match instanceof HTMLButtonElement)) {
    throw new Error(`Button not found: ${label}`);
  }
  return match;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.clearUserOrigin.mockResolvedValue({ ok: true });
  mocks.setUiState.mockResolvedValue({ ok: true });
  mocks.setUserOrigin.mockResolvedValue({ ok: true });
});

afterEach(() => {
  for (const dispose of disposers.splice(0)) dispose();
  document.body.replaceChildren();
});

describe("persisted UI transitions", () => {
  test("keeps settings open when disabling cannot be saved", async () => {
    mocks.setUserOrigin.mockResolvedValue({ ok: false, reason: "blocked" });
    const close = vi.fn();

    mount(() => (
      <Options
        targets={allTargets}
        onClose={close}
        showDisableDialog={vi.fn()}
        portalMount={document.createElement("div")}
        onTryAction={vi.fn()}
      />
    ));
    button("Disable").click();

    await vi.waitFor(() => {
      expect(close).not.toHaveBeenCalled();
      expect(document.querySelector('[role="status"]')?.textContent).toContain(
        "Could not save"
      );
    });
  });

  test("keeps the disable confirmation open and explains a failed write", async () => {
    mocks.setUserOrigin.mockResolvedValue({ ok: false, reason: "blocked" });
    const close = vi.fn();

    mount(() => <DisableConfirmation onClose={close} />);
    button("Confirm").click();

    await vi.waitFor(() => {
      expect(close).not.toHaveBeenCalled();
      expect(document.querySelector('[role="alert"]')?.textContent).toContain(
        "Could not disable Locator"
      );
    });
  });

  test("does not hide the intro when its preference cannot be saved", async () => {
    mocks.setUserOrigin.mockResolvedValue({ ok: false, reason: "blocked" });

    mount(() => (
      <IntroInfo openOptions={vi.fn()} hide={false} adapter="react" />
    ));
    button("Stop showing this popup").click();

    await vi.waitFor(() => {
      expect(document.querySelector('[role="alert"]')?.textContent).toBe(
        "Could not save"
      );
    });
  });

  test("advances onboarding only after its progress is saved", async () => {
    mocks.setUiState
      .mockResolvedValueOnce({ ok: false, reason: "blocked" })
      .mockResolvedValueOnce({ ok: true });

    mount(() => (
      <WelcomeScreen
        originalLinkProps={null}
        targets={allTargets}
        onClose={vi.fn()}
        onTry={vi.fn()}
        portalMount={document.createElement("div")}
      />
    ));
    button("Continue").click();
    await vi.waitFor(() => {
      expect(document.querySelector("h1")?.textContent).toBe(
        "Welcome to Locator"
      );
      expect(document.querySelector('[role="alert"]')?.textContent).toContain(
        "Could not save"
      );
    });

    button("Continue").click();
    await vi.waitFor(() => {
      expect(document.querySelector("h1")?.textContent).toBe(
        "Pick your editor"
      );
    });
  });
});
