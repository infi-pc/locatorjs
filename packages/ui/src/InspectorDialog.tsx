import { css, cx } from "@locator/styled-system/css";
import { X } from "lucide-solid";
import {
  Show,
  createEffect,
  createUniqueId,
  onCleanup,
  type JSX,
} from "solid-js";
import { Portal } from "solid-js/web";
import { usePortalMount } from "./PortalMount";

const styles = {
  backdrop: css({
    alignItems: "stretch",
    animation: "fade-in 120ms ease-out",
    bg: "black/45",
    display: "flex",
    inset: "0",
    justifyContent: "flex-end",
    overscrollBehavior: "contain",
    pointerEvents: "auto",
    zIndex: "modal",
  }),
  viewportBackdrop: css({ position: "fixed" }),
  containedBackdrop: css({ position: "absolute" }),
  content: css({
    animation: "slide-from-right-full 180ms ease-out",
    bg: "bg.default",
    borderLeftColor: "border",
    borderLeftWidth: "1px",
    boxShadow: "2xl",
    color: "fg.default",
    h: "100%",
    overflowY: "auto",
    position: "relative",
    width: "80%",
    _focus: { outline: "none" },
  }),
  close: css({
    alignItems: "center",
    borderRadius: "l1",
    color: "fg.muted",
    cursor: "pointer",
    display: "inline-flex",
    h: "8",
    justifyContent: "center",
    position: "absolute",
    right: "3",
    top: "3",
    w: "8",
    zIndex: "base",
    _hover: { bg: "gray.subtle.bg", color: "fg.default" },
    _focusVisible: { focusVisibleRing: "outside" },
  }),
  title: css({
    border: "0",
    clip: "rect(0, 0, 0, 0)",
    h: "1px",
    m: "-1px",
    overflow: "hidden",
    p: "0",
    position: "absolute",
    whiteSpace: "nowrap",
    w: "1px",
  }),
};

const focusableSelector = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function InspectorDialog(props: {
  open: boolean;
  portalMount?: Node;
  contained?: boolean;
  children: JSX.Element;
  onOpenChange: (open: boolean) => void;
}) {
  const portalMount = usePortalMount(() => props.portalMount);
  let content: HTMLDivElement | undefined;
  const titleId = `locator-interaction-dialog-${createUniqueId()}`;
  const activeElement = () => {
    const root = content?.getRootNode();
    return root && "activeElement" in root
      ? (root.activeElement as Element | null)
      : document.activeElement;
  };

  createEffect(() => {
    if (!props.open) return;

    const root = portalMount().getRootNode();
    const previouslyFocused =
      root && "activeElement" in root
        ? (root.activeElement as Element | null)
        : document.activeElement;
    const restoreFocus =
      previouslyFocused instanceof HTMLElement ? previouslyFocused : undefined;

    queueMicrotask(() => content?.focus({ preventScroll: true }));

    onCleanup(() => {
      if (restoreFocus?.isConnected) queueMicrotask(() => restoreFocus.focus());
    });
  });

  const handleKeyDown: JSX.EventHandlerUnion<HTMLDivElement, KeyboardEvent> = (
    event
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      props.onOpenChange(false);
      return;
    }

    if (event.key !== "Tab" || !content) return;

    const focusable = Array.from(
      content.querySelectorAll<HTMLElement>(focusableSelector)
    ).filter((element) => !element.hidden);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) {
      event.preventDefault();
      content.focus();
      return;
    }

    if (
      event.shiftKey &&
      (activeElement() === first || activeElement() === content)
    ) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && activeElement() === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <Show when={props.open}>
      <Portal mount={portalMount()}>
        <div
          class={cx(
            styles.backdrop,
            props.contained ? styles.containedBackdrop : styles.viewportBackdrop
          )}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) props.onOpenChange(false);
          }}
        >
          <div
            ref={content}
            class={styles.content}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
          >
            <h2 id={titleId} class={styles.title}>
              Interaction editor
            </h2>
            <button
              type="button"
              class={styles.close}
              aria-label="Close interaction editor"
              onClick={() => props.onOpenChange(false)}
            >
              <X size={16} />
            </button>
            {props.children}
          </div>
        </div>
      </Portal>
    </Show>
  );
}
