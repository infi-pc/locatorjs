import { clearPrimaryEditorOverride, strictConfig } from "@locator/shared";
import {
  BindingsEditor,
  Button,
  EditorPicker,
  PromoFooter,
  Wizard,
  type WizardStep,
} from "@locator/ui";
import { css, cx } from "@locator/styled-system/css";
import { button } from "@locator/styled-system/recipes";
import { createSignal } from "solid-js";
import { buildLink } from "../functions/buildLink";
import { isExtension } from "../functions/isExtension";
import { useOptions } from "../functions/optionsContext";
import { LinkProps } from "../types/types";

const styles = {
  stack: css({ display: "flex", flexDirection: "column", gap: "3" }),
  proof: css({
    bg: "gray.subtle.bg",
    borderRadius: "l2",
    color: "fg.muted",
    fontFamily: "mono",
    fontSize: "xs",
    overflowWrap: "anywhere",
    p: "3",
  }),
  text: css({ color: "fg.muted", fontSize: "sm" }),
  testLink: cx(
    button({ variant: "solid", size: "sm" }),
    css({ alignSelf: "flex-start", colorPalette: "violet" })
  ),
  actions: css({ display: "flex", gap: "2" }),
};

const STEP_IDS = ["welcome", "editor", "shortcuts", "test", "done"];

export function WelcomeScreen(props: {
  originalLinkProps: LinkProps | null;
  targets: strictConfig.TargetViewMap;
  onClose: () => void;
  onTry: () => void;
  portalMount: HTMLDivElement;
  /**
   * Step to open on, overriding the one onboarding left off at. Used when the
   * wizard is opened to answer a specific question — "which editor?" — rather
   * than to resume onboarding.
   */
  initialStep?: string;
}) {
  const options = useOptions();
  // eslint-disable-next-line solid/reactivity -- the wizard intentionally snapshots its initial step.
  const requestedStep = props.initialStep;
  const savedStep = options.uiState().onboarding?.step;
  const startingStep = [requestedStep, savedStep].find(
    (step): step is string => !!step && STEP_IDS.includes(step)
  );
  const [active, setActiveSignal] = createSignal(startingStep ?? "welcome");
  const [saveError, setSaveError] = createSignal(false);
  const [pickerPending, setPickerPending] = createSignal(false);
  const [writePending, setWritePending] = createSignal(false);

  const setActive = async (step: string) => {
    if (writePending() || pickerPending()) return;
    setWritePending(true);
    setSaveError(false);
    try {
      const result = await options.setUiState({
        onboarding: { ...(options.uiState().onboarding ?? {}), step },
      });
      if (result.ok) setActiveSignal(step);
      else setSaveError(true);
    } finally {
      setWritePending(false);
    }
  };
  const dismiss = async () => {
    if (writePending() || pickerPending()) return;
    setWritePending(true);
    setSaveError(false);
    try {
      const result = await options.setUiState({
        welcomeScreenDismissed: true,
        onboarding: { dismissed: true, step: "done" },
      });
      if (result.ok) props.onClose();
      else setSaveError(true);
    } finally {
      setWritePending(false);
    }
  };
  const currentLink = () => {
    const editor = options.effective().editor;
    return props.originalLinkProps && editor.kind === "selected"
      ? buildLink(props.originalLinkProps, options, editor)
      : undefined;
  };
  const editor = (): strictConfig.EditorDestination | undefined => {
    const effective = options.effective().editor;
    return effective.kind === "selected"
      ? strictConfig.encodeEditorDestination(effective.destination)
      : undefined;
  };
  const updateEditor = (
    destination: strictConfig.EditorDestination | undefined
  ) => {
    // An override left on the primary action would silently shadow the pick.
    const bindings = clearPrimaryEditorOverride(
      strictConfig.encodeBindings(options.effective().bindings)
    );
    return options.setUserOrigin(
      destination
        ? {
            set: {
              editor: destination,
              ...(bindings ? { bindings } : {}),
            },
          }
        : { unset: ["editor"] }
    );
  };

  const steps = (): WizardStep[] => [
    {
      id: "welcome",
      title: "Welcome to Locator",
      description: "Jump from a browser element directly to its source.",
      content: () => (
        <div class={styles.stack}>
          <p class={styles.text}>
            Locator found source information for the element you clicked:
          </p>
          <div class={styles.proof}>
            {props.originalLinkProps
              ? `${props.originalLinkProps.filePath}:${props.originalLinkProps.line}:${props.originalLinkProps.column}`
              : "Source location detected"}
          </div>
        </div>
      ),
    },
    {
      id: "editor",
      title: "Pick your editor",
      description:
        "Every source link opens here unless an action overrides it.",
      content: () => (
        <EditorPicker
          targets={options.allTargets()}
          value={editor()}
          portalMount={props.portalMount}
          onChange={updateEditor}
          onPendingChange={setPickerPending}
        />
      ),
    },
    {
      id: "shortcuts",
      title: "Choose your controls",
      description: "Map modifier-click shortcuts to different actions.",
      content: () => (
        <BindingsEditor
          value={[...strictConfig.encodeBindings(options.effective().bindings)]}
          targets={options.allTargets()}
          editor={editor()}
          triggers={["modifier-click"]}
          portalMount={props.portalMount}
          onChange={(bindings) =>
            bindings
              ? options.setUserOrigin({ set: { bindings } })
              : options.setUserOrigin({ unset: ["bindings"] })
          }
        />
      ),
    },
    {
      id: "test",
      title: "Test it",
      description: "Open the detected source or try another page element.",
      content: () => (
        <div class={styles.stack}>
          <div class={styles.actions}>
            <a
              href={currentLink()}
              target={options.effective().hrefTarget}
              class={styles.testLink}
            >
              Test link
            </a>
            <Button variant="outline" onClick={props.onTry}>
              Try another element
            </Button>
          </div>
          <p class={styles.text}>
            Hover an element and click it. Press Esc to return.
          </p>
        </div>
      ),
    },
    {
      id: "done",
      title: "You’re ready",
      description: "Your settings are saved for this site.",
      content: () => (
        <PromoFooter
          promos={[
            ...(!isExtension()
              ? [
                  {
                    text: "Use your Locator settings across every site.",
                    href: "https://www.locatorjs.com/install",
                    linkLabel: "Install the browser extension",
                  },
                ]
              : []),
            {
              text: "You can change these controls at any time.",
              href: "https://www.locatorjs.com/docs",
              linkLabel: "Read the docs",
            },
          ]}
        />
      ),
    },
  ];

  return (
    <Wizard
      size="dialog"
      steps={steps()}
      activeId={active()}
      onStepChange={setActive}
      onFinish={dismiss}
      onSkip={dismiss}
      busy={writePending()}
      nextDisabled={
        active() === "editor" && (pickerPending() || editor() === undefined)
      }
      finishDisabled={pickerPending() || editor() === undefined}
      error={
        saveError() ? "Could not save your progress. Try again." : undefined
      }
    />
  );
}
