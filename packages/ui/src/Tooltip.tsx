import { JSX, Show, createSignal, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { css, cx } from "@locator/styled-system/css";

const styles = {
  trigger: css({ display: "inline-flex" }),
  tooltip: css({
    bg: "gray.12",
    borderRadius: "l2",
    boxShadow: "lg",
    color: "gray.1",
    fontSize: "xs",
    lineHeight: "1.125rem",
    maxW: "72",
    px: "2",
    py: "1",
    pointerEvents: "none",
    textAlign: "center",
    zIndex: "tooltip",
  }),
};

export function Tooltip(props: {
  label: string;
  children: JSX.Element;
  portalMount?: Node;
  class?: string;
}) {
  const [open, setOpen] = createSignal(false);
  const [rect, setRect] = createSignal<DOMRect | undefined>();
  const id = `locatorjs-tooltip-${Math.random().toString(36).slice(2)}`;
  let trigger: HTMLSpanElement | undefined;

  function show() {
    if (trigger) setRect(trigger.getBoundingClientRect());
    setOpen(true);
  }

  function hide() {
    setOpen(false);
  }

  function updatePosition() {
    if (open() && trigger) setRect(trigger.getBoundingClientRect());
  }

  window.addEventListener("resize", updatePosition);
  window.addEventListener("scroll", updatePosition, true);
  onCleanup(() => {
    window.removeEventListener("resize", updatePosition);
    window.removeEventListener("scroll", updatePosition, true);
  });

  const overlay = () => {
    const current = rect();
    return (
      <div
        id={id}
        role="tooltip"
        class={styles.tooltip}
        style={{
          position: "fixed",
          left: `${Math.max(
            8,
            (current?.left ?? 0) + (current?.width ?? 0) / 2
          )}px`,
          top: `${Math.max(8, (current?.top ?? 0) - 8)}px`,
          transform: "translate(-50%, -100%)",
        }}
      >
        {props.label}
      </div>
    );
  };

  return (
    <span
      ref={trigger}
      class={cx(styles.trigger, props.class)}
      aria-describedby={open() ? id : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusIn={show}
      onFocusOut={hide}
    >
      {props.children}
      <Show when={open()}>
        <Portal mount={props.portalMount ?? document.body}>{overlay()}</Portal>
      </Show>
    </span>
  );
}
