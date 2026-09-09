import { JSX, Show, createUniqueId } from "solid-js";
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
  controlId?: string;
  meta?: JSX.Element;
  helper?: JSX.Element;
  error?: JSX.Element;
  class?: string;
  children: JSX.Element;
}) {
  const fallbackLabelId = `locator-field-label-${createUniqueId()}`;
  return (
    <div
      class={cx(styles.root, props.class)}
      role={props.controlId ? undefined : "group"}
      aria-labelledby={props.controlId ? undefined : fallbackLabelId}
    >
      <div class={styles.header}>
        <Show
          when={props.controlId}
          fallback={
            <span id={fallbackLabelId} class={styles.label}>
              {props.label}
            </span>
          }
        >
          {(controlId) => (
            <label class={styles.label} for={controlId()}>
              {props.label}
            </label>
          )}
        </Show>
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
