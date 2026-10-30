import { css, cx } from "@locator/styled-system/css";
import { Check } from "lucide-solid";
import { For, JSX, Show } from "solid-js";
import { Button } from "./Button";

export type WizardStep = {
  id: string;
  title: string;
  description?: string;
  content: JSX.Element | (() => JSX.Element);
  /** Overrides the default "go to next step" behavior of the Continue button. */
  onNext?: () => void;
  /** Overrides the default "go to previous step" behavior of the Back button. */
  onBack?: () => void;
};

const styles = {
  root: css({
    bg: "bg.default",
    borderColor: "border",
    borderRadius: "l3",
    borderWidth: "1px",
    boxShadow: "xl",
    color: "fg.default",
    display: "grid",
    gridTemplateRows: "auto minmax(0, 1fr) auto",
    overflow: "hidden",
    pointerEvents: "auto",
  }),
  dialog: css({ height: "520px", maxH: "calc(100vh - 32px)", width: "480px" }),
  page: css({ minH: "560px", width: "min(640px, calc(100vw - 32px))" }),
  header: css({
    borderBottomColor: "border",
    borderBottomWidth: "1px",
    display: "flex",
    flexDirection: "column",
    gap: "3",
    p: "4",
  }),
  title: css({ fontSize: "xl", fontWeight: "bold" }),
  description: css({ color: "fg.muted", fontSize: "sm", mt: "1" }),
  progress: css({ alignItems: "center", display: "flex", gap: "2" }),
  indicator: css({
    alignItems: "center",
    bg: "gray.subtle.bg",
    borderRadius: "full",
    color: "fg.muted",
    display: "inline-flex",
    fontSize: "xs",
    height: "6",
    justifyContent: "center",
    width: "6",
  }),
  indicatorActive: css({ bg: "accent.solid.bg", color: "accent.solid.fg" }),
  body: css({ overflowY: "auto", overscrollBehavior: "contain", p: "4" }),
  footer: css({
    alignItems: "center",
    borderTopColor: "border",
    borderTopWidth: "1px",
    display: "flex",
    gap: "2",
    justifyContent: "space-between",
    p: "4",
  }),
  footerActions: css({ display: "flex", gap: "2" }),
  error: css({ color: "error", fontSize: "xs" }),
};

export function Wizard(props: {
  steps: WizardStep[];
  activeId: string;
  onStepChange: (id: string) => void;
  onFinish: () => void;
  onSkip?: () => void;
  error?: string;
  size?: "dialog" | "page";
  finishLabel?: string;
  nextDisabled?: boolean;
  finishDisabled?: boolean;
  busy?: boolean;
}) {
  const activeIndex = () => {
    const index = props.steps.findIndex((step) => step.id === props.activeId);
    return index < 0 ? 0 : index;
  };
  const active = () => props.steps[activeIndex()];
  const activeContent = () => {
    const content = active()?.content;
    return typeof content === "function" ? content() : content;
  };
  const go = (index: number) => {
    const step = props.steps[index];
    if (step) props.onStepChange(step.id);
  };

  return (
    <div
      class={cx(
        styles.root,
        props.size === "page" ? styles.page : styles.dialog
      )}
    >
      <header class={styles.header}>
        <div class={styles.progress} aria-label="Setup progress">
          <For each={props.steps}>
            {(step, index) => (
              <span
                class={cx(
                  styles.indicator,
                  index() <= activeIndex() && styles.indicatorActive
                )}
                aria-label={`${step.title}${
                  index() === activeIndex() ? ", current step" : ""
                }`}
              >
                {index() < activeIndex() ? <Check size={12} /> : index() + 1}
              </span>
            )}
          </For>
        </div>
        <div>
          <h1 class={styles.title}>{active()?.title}</h1>
          <Show when={active()?.description}>
            <p class={styles.description}>{active()?.description}</p>
          </Show>
        </div>
      </header>
      <main class={styles.body}>{activeContent()}</main>
      <footer class={styles.footer}>
        <div>
          <Show when={props.onSkip}>
            <Button
              size="sm"
              variant="ghost"
              disabled={props.busy}
              onClick={() => {
                if (!props.busy) props.onSkip?.();
              }}
            >
              Skip setup
            </Button>
          </Show>
          <Show when={props.error}>
            <span class={styles.error} role="alert">
              {props.error}
            </span>
          </Show>
        </div>
        <div class={styles.footerActions}>
          <Button
            size="sm"
            variant="outline"
            disabled={props.busy || (activeIndex() === 0 && !active()?.onBack)}
            onClick={() => {
              if (props.busy) return;
              const back = active()?.onBack;
              if (back) {
                back();
              } else {
                go(activeIndex() - 1);
              }
            }}
          >
            Back
          </Button>
          <Show
            when={activeIndex() === props.steps.length - 1}
            fallback={
              <Button
                size="sm"
                variant="primary"
                disabled={props.busy || props.nextDisabled}
                onClick={() => {
                  if (props.busy || props.nextDisabled) return;
                  const next = active()?.onNext;
                  if (next) {
                    next();
                  } else {
                    go(activeIndex() + 1);
                  }
                }}
              >
                Continue
              </Button>
            }
          >
            <Button
              size="sm"
              variant="primary"
              disabled={props.busy || props.finishDisabled}
              onClick={() => {
                if (!props.busy && !props.finishDisabled) props.onFinish();
              }}
            >
              {props.finishLabel ?? "Finish"}
            </Button>
          </Show>
        </div>
      </footer>
    </div>
  );
}
