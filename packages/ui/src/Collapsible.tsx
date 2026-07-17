import { JSX, Show, createSignal } from "solid-js";
import { ChevronDown } from "lucide-solid";
import { css, cx } from "@locator/styled-system/css";

const styles = {
  root: css({ display: "flex", flexDirection: "column", gap: "2" }),
  trigger: css({
    alignItems: "center",
    color: "fg.default",
    cursor: "pointer",
    display: "inline-flex",
    fontSize: "sm",
    fontWeight: "medium",
    gap: "1.5",
    outline: "0",
    _focusVisible: { focusVisibleRing: "outside" },
  }),
  icon: css({
    height: "4",
    transition: "transform 150ms ease",
    width: "4",
    _open: { transform: "rotate(180deg)" },
  }),
  content: css({
    animationDuration: "150ms",
    animationTimingFunction: "ease",
    overflow: "hidden",
  }),
};

export function Collapsible(props: {
  label: JSX.Element;
  defaultOpen?: boolean;
  children: JSX.Element;
}) {
  const [open, setOpen] = createSignal(!!props.defaultOpen);
  return (
    <div class={styles.root}>
      <button
        type="button"
        class={styles.trigger}
        aria-expanded={open()}
        onClick={() => setOpen((value) => !value)}
      >
        <ChevronDown class={cx(styles.icon, open() ? "open" : undefined)} />
        {props.label}
      </button>
      <Show when={open()}>
        <div class={styles.content}>{props.children}</div>
      </Show>
    </div>
  );
}
