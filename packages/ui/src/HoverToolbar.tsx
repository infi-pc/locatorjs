import { css, cx } from "@locator/styled-system/css";
import { splitProps, type JSX } from "solid-js";

const styles = {
  frame: css({
    alignItems: "center",
    bg: "black/60",
    borderRadius: "l2",
    color: "white",
    display: "inline-flex",
    fontWeight: "bold",
    px: "1",
    py: "1",
  }),
  button: css({
    alignItems: "center",
    appearance: "none",
    borderRadius: "l1",
    color: "white",
    cursor: "pointer",
    display: "inline-flex",
    h: "8",
    justifyContent: "center",
    opacity: "0.88",
    p: "0",
    w: "8",
    _hover: { bg: "white/20", opacity: "1" },
    _focusVisible: { outline: "2px solid white", outlineOffset: "-2px" },
    _disabled: { cursor: "default", opacity: "0.45" },
  }),
  selected: css({
    bg: "white/25",
    boxShadow: "inset 0 0 0 1px white/60",
    opacity: "1",
  }),
};

export function HoverToolbarFrame(props: JSX.HTMLAttributes<HTMLDivElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return <div class={cx(styles.frame, local.class)} {...rest} />;
}

export function HoverToolbarButton(
  props: JSX.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }
) {
  const [local, rest] = splitProps(props, ["class", "selected"]);
  return (
    <button
      type="button"
      class={cx(styles.button, local.selected && styles.selected, local.class)}
      aria-pressed={local.selected === undefined ? undefined : local.selected}
      {...rest}
    />
  );
}
