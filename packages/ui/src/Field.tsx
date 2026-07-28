import { JSX, Show } from "solid-js";
import { css, cx } from "@locator/styled-system/css";

const styles = {
  root: css({ display: "flex", flexDirection: "column", gap: "1.5" }),
  header: css({
    alignItems: "center",
    display: "grid",
    gap: "2",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    minH: "5",
  }),
  label: css({ color: "fg.default", textStyle: "label" }),
  meta: css({
    alignItems: "center",
    color: "fg.muted",
    display: "inline-flex",
    fontSize: "xs",
    gap: "1.5",
    justifyContent: "flex-end",
    minW: "24",
    textAlign: "right",
  }),
  helper: css({ color: "fg.muted", textStyle: "caption" }),
  error: css({ color: "error", textStyle: "caption" }),
};

export function Field(props: {
  label: JSX.Element;
  meta?: JSX.Element;
  helper?: JSX.Element;
  error?: JSX.Element;
  class?: string;
  children: JSX.Element;
}) {
  return (
    <div class={cx(styles.root, props.class)}>
      <div class={styles.header}>
        <label class={styles.label}>{props.label}</label>
        <div class={styles.meta}>{props.meta}</div>
      </div>
      {props.children}
      <Show when={props.helper}>
        <div class={styles.helper}>{props.helper}</div>
      </Show>
      <Show when={props.error}>
        <div class={styles.error}>{props.error}</div>
      </Show>
    </div>
  );
}
