import {
  primaryEditorBinding,
  replacePrimaryEditorBinding,
  type BindingAction,
  type Targets,
} from "@locator/shared";
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
import { HREF_TARGET } from "../consts";
import { effectiveBindings } from "../functions/bindings";
import { buildLink } from "../functions/buildLink";
import { isExtension } from "../functions/isExtension";
import { useOptions } from "../functions/optionsStore";
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
  targets: Targets;
  onClose: () => void;
  onTry: () => void;
  portalMount: HTMLDivElement;
}) {
  const options = useOptions();
  const savedStep = options.uiState().onboarding?.step;
  const [active, setActiveSignal] = createSignal(
    savedStep && STEP_IDS.includes(savedStep) ? savedStep : "welcome"
  );

  const setActive = (step: string) => {
    setActiveSignal(step);
    options.setUiState({
      onboarding: { ...(options.uiState().onboarding ?? {}), step },
    });
  };
  const dismiss = () => {
    options.setUiState({
      welcomeScreenDismissed: true,
      onboarding: { dismissed: true, step: "done" },
    });
    props.onClose();
  };
  const currentLink = () =>
    props.originalLinkProps
      ? buildLink(props.originalLinkProps, props.targets, options)
      : undefined;
  const editorAction = () => {
    const action = primaryEditorBinding(options.effective().bindings)?.action;
    return action?.kind === "open-editor" ? action : undefined;
  };
  const updatePrimaryEditor = async (
    patch: Pick<
      Extract<BindingAction, { kind: "open-editor" }>,
      "targetId" | "targetTemplate"
    >
  ) => {
    const bindings = effectiveBindings(options.effective());
    const next = replacePrimaryEditorBinding(bindings, patch);
    if (!next) return false;
    return (await options.setUserOrigin({ bindings: next })).ok;
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
      description: "This is the default destination for open-editor actions.",
      content: () => (
        <EditorPicker
          targets={options.allTargets()}
          targetId={editorAction()?.targetId}
          targetTemplate={editorAction()?.targetTemplate}
          portalMount={props.portalMount}
          onChange={updatePrimaryEditor}
        />
      ),
    },
    {
      id: "shortcuts",
      title: "Choose your controls",
      description: "Map modifier-click shortcuts to different actions.",
      content: () => (
        <BindingsEditor
          value={effectiveBindings(options.effective())}
          targets={options.allTargets()}
          triggers={["modifier-click"]}
          portalMount={props.portalMount}
          onChange={(bindings) =>
            options.setUserOrigin({ bindings, mouseModifiers: undefined })
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
              target={options.effective().hrefTarget || HREF_TARGET}
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
    />
  );
}
