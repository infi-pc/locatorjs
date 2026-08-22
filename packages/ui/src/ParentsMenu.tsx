import { css, cx } from "@locator/styled-system/css";
import { Component, CornerLeftUp, ExternalLink } from "lucide-solid";
import { For, Show, createEffect, createSignal } from "solid-js";
import type { ParentRow } from "./treeModel";

const styles = {
  menu: css({
    bg: "bg.default",
    borderColor: "border",
    borderRadius: "l3",
    borderWidth: "1px",
    boxShadow: "xl",
    color: "fg.default",
    display: "flex",
    flexDirection: "column",
    maxH: "min(60vh, 24rem)",
    maxW: "24rem",
    minW: "16rem",
    overflow: "hidden",
    pointerEvents: "auto",
    _focusVisible: { outline: "none" },
  }),
  header: css({
    alignItems: "center",
    borderBottomColor: "border",
    borderBottomWidth: "1px",
    color: "fg.muted",
    display: "flex",
    fontSize: "2xs",
    fontWeight: "semibold",
    gap: "1.5",
    letterSpacing: "wide",
    px: "2.5",
    py: "1.5",
    textTransform: "uppercase",
  }),
  list: css({
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    overscrollBehavior: "contain",
    py: "1",
  }),
  item: css({
    alignItems: "center",
    color: "fg.default",
    cursor: "pointer",
    display: "grid",
    gap: "2",
    gridTemplateColumns: "auto minmax(0, 1fr) 0.75rem",
    minH: "9",
    px: "2.5",
    textDecoration: "none",
    _hover: { bg: "accent.subtle.bg" },
  }),
  focused: css({ bg: "accent.subtle.bg" }),
  inert: css({ color: "fg.muted", cursor: "default", _hover: { bg: "none" } }),
  icon: css({ color: "accent.plain.fg", flexShrink: "0" }),
  declarationIcon: css({ color: "fg.subtle", flexShrink: "0" }),
  text: css({ display: "flex", flexDirection: "column", minW: "0" }),
  title: css({
    alignItems: "baseline",
    display: "flex",
    fontSize: "xs",
    gap: "1.5",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  component: css({ fontWeight: "semibold" }),
  tag: css({ color: "fg.muted", fontFamily: "mono" }),
  detail: css({
    color: "fg.subtle",
    fontSize: "2xs",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  open: css({ color: "fg.subtle", flexShrink: "0", opacity: "0" }),
  openVisible: css({ opacity: "1" }),
  empty: css({ color: "fg.subtle", fontSize: "xs", px: "2.5", py: "3" }),
};

/**
 * Ancestors of the inspected element, each labelled with the component that
 * renders it and its exact `file:line` so two entries in the same file are
 * told apart.
 */
export function ParentsMenu(props: {
  rows: ParentRow[];
  onOpen: (row: ParentRow) => void;
  onHover: (id: string | null) => void;
  onClose: () => void;
  /** Real href so the row supports open-in-new-tab and shows its target. */
  hrefFor?: (row: ParentRow) => string | undefined;
  autofocus?: boolean;
}) {
  let list: HTMLDivElement | undefined;
  const [focused, setFocused] = createSignal(-1);
  const [hovered, setHovered] = createSignal<string | null>(null);

  createEffect(() => {
    if (props.autofocus) list?.focus({ preventScroll: true });
  });

  const openable = () => props.rows.filter((row) => row.source);

  const moveFocus = (delta: number) => {
    const rows = props.rows;
    if (!rows.length) return;
    const next = (focused() + delta + rows.length) % rows.length;
    setFocused(next);
    props.onHover(rows[next]!.id);
    list
      ?.querySelector(`[data-row-index="${next}"]`)
      ?.scrollIntoView({ block: "nearest" });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveFocus(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveFocus(-1);
        break;
      case "Enter":
      case " ": {
        const row = props.rows[focused()];
        if (!row?.source) break;
        event.preventDefault();
        props.onOpen(row);
        break;
      }
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        props.onClose();
        break;
    }
  };

  return (
    <div
      ref={list}
      class={styles.menu}
      role="menu"
      aria-label="Parents"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseLeave={() => {
        setHovered(null);
        props.onHover(null);
      }}
    >
      <div class={styles.header}>
        <CornerLeftUp size={12} /> Parents
      </div>
      <div class={styles.list}>
        <Show
          when={props.rows.length > 0}
          fallback={<div class={styles.empty}>No parents with a source.</div>}
        >
          <For each={props.rows}>
            {(row, index) => {
              const href = () => props.hrefFor?.(row);
              const clickable = () => Boolean(row.source);
              return (
                <a
                  role="menuitem"
                  data-row-index={index()}
                  data-row-kind={row.kind}
                  href={href()}
                  aria-disabled={clickable() ? undefined : true}
                  class={cx(
                    styles.item,
                    !clickable() && styles.inert,
                    focused() === index() && styles.focused
                  )}
                  onMouseEnter={() => {
                    setHovered(row.id);
                    setFocused(index());
                    props.onHover(row.id);
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (clickable()) props.onOpen(row);
                  }}
                >
                  <Show
                    when={row.kind === "call-site"}
                    fallback={
                      <Component size={13} class={styles.declarationIcon} />
                    }
                  >
                    <Component size={13} class={styles.icon} />
                  </Show>
                  <span class={styles.text}>
                    <span class={styles.title}>
                      <Show when={row.component}>
                        <span class={styles.component}>{row.component}</span>
                      </Show>
                      <Show when={row.tag}>
                        <span class={styles.tag}>&lt;{row.tag}&gt;</span>
                      </Show>
                      <Show when={row.kind === "declaration"}>
                        <span class={styles.tag}>defined in</span>
                      </Show>
                    </span>
                    <Show when={row.detail}>
                      <span class={styles.detail}>{row.detail}</span>
                    </Show>
                  </span>
                  <ExternalLink
                    size={11}
                    class={cx(
                      styles.open,
                      clickable() &&
                        (hovered() === row.id || focused() === index()) &&
                        styles.openVisible
                    )}
                  />
                </a>
              );
            }}
          </For>
        </Show>
        <Show when={props.rows.length > 0 && openable().length === 0}>
          <div class={styles.empty}>None of these resolve to a source.</div>
        </Show>
      </div>
    </div>
  );
}
