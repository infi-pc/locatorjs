import { css, cx } from "@locator/styled-system/css";
import {
  ChevronDown,
  ChevronRight,
  ChevronsUp,
  Component,
  ExternalLink,
  X,
} from "lucide-solid";
import { For, Show, createEffect, createSignal, untrack } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { IconButton } from "./IconButton";
import { visibleTreeRows, type TreeRow, type TreeViewModel } from "./treeModel";

const INDENT_REM = 0.875;

const styles = {
  panel: css({
    bg: "bg.default",
    borderColor: "border",
    borderRadius: "l3",
    borderWidth: "1px",
    boxShadow: "xl",
    color: "fg.default",
    display: "flex",
    flexDirection: "column",
    maxW: "26rem",
    minW: "18rem",
    overflow: "hidden",
    pointerEvents: "auto",
  }),
  header: css({
    alignItems: "center",
    borderBottomColor: "border",
    borderBottomWidth: "1px",
    display: "grid",
    gap: "2",
    gridTemplateColumns: "auto minmax(0, 1fr) auto",
    px: "2",
    py: "1.5",
  }),
  title: css({
    fontSize: "xs",
    fontWeight: "semibold",
    letterSpacing: "wide",
    textTransform: "uppercase",
    color: "fg.muted",
  }),
  body: css({
    display: "flex",
    flexDirection: "column",
    maxH: "60vh",
    overflowY: "auto",
    overscrollBehavior: "contain",
    py: "1",
    _focusVisible: { outline: "none" },
  }),
  row: css({
    alignItems: "center",
    appearance: "none",
    bg: "transparent",
    border: "none",
    color: "fg.default",
    display: "grid",
    gap: "1.5",
    gridTemplateColumns: "1rem 0.85rem minmax(0, 1fr) minmax(0, auto) 0.7rem",
    minH: "6",
    pr: "2",
    textAlign: "left",
    width: "100%",
  }),
  clickable: css({
    cursor: "pointer",
    _hover: { bg: "accent.subtle.bg" },
  }),
  inert: css({ color: "fg.muted", cursor: "default" }),
  selected: css({ bg: "amber.subtle.bg" }),
  focused: css({
    boxShadow: "inset 0 0 0 1px var(--colors-accent-outline-border)",
  }),
  twisty: css({
    alignItems: "center",
    appearance: "none",
    bg: "transparent",
    border: "none",
    color: "fg.subtle",
    cursor: "pointer",
    display: "inline-flex",
    height: "4",
    justifyContent: "center",
    padding: "0",
    width: "4",
    _hover: { color: "fg.default" },
  }),
  guide: css({
    borderLeftColor: "border",
    borderLeftWidth: "1px",
    height: "100%",
  }),
  componentIcon: css({ color: "accent.plain.fg", flexShrink: "0" }),
  label: css({
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  componentLabel: css({ fontSize: "xs", fontWeight: "semibold" }),
  elementLabel: css({ fontFamily: "mono", fontSize: "xs" }),
  bracket: css({ color: "fg.subtle" }),
  detail: css({
    color: "fg.subtle",
    fontSize: "2xs",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  open: css({ color: "fg.subtle", flexShrink: "0", opacity: "0" }),
  openVisible: css({ opacity: "1" }),
  goUp: css({
    alignItems: "center",
    appearance: "none",
    bg: "transparent",
    border: "none",
    color: "fg.muted",
    cursor: "pointer",
    display: "flex",
    fontSize: "2xs",
    gap: "1.5",
    minH: "6",
    px: "2",
    width: "100%",
    _hover: { bg: "gray.subtle.bg", color: "fg.default" },
  }),
  empty: css({ color: "fg.subtle", fontSize: "xs", px: "3", py: "4" }),
  footer: css({
    borderTopColor: "border",
    borderTopWidth: "1px",
    color: "fg.subtle",
    fontSize: "2xs",
    px: "2",
    py: "1.5",
  }),
};

/**
 * Tree of components and elements around the inspected node. Rows that resolve
 * to a source open it; rows that do not are visibly inert instead of looking
 * clickable and doing nothing.
 */
export function TreePanel(props: {
  model: TreeViewModel;
  expandedIds: ReadonlySet<string>;
  pendingIds?: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onOpen: (row: TreeRow) => void;
  onHover: (id: string | null) => void;
  onGoUp: () => void;
  onClose: () => void;
  title?: string;
  hint?: string;
  /** Focuses the row list on mount so arrow keys work without a click. */
  autofocus?: boolean;
}) {
  let list: HTMLDivElement | undefined;
  const [focused, setFocused] = createSignal(0);
  const [hovered, setHovered] = createSignal<string | null>(null);
  const [flat, setFlat] = createStore<
    Array<ReturnType<typeof visibleTreeRows>[number] & { key: string }>
  >([]);
  createEffect(() => {
    setFlat(
      reconcile(
        visibleTreeRows(props.model.rows, props.expandedIds).map((item) => ({
          ...item,
          key: item.row.id,
        })),
        { key: "key" }
      )
    );
  });

  /**
   * Focus follows the selection, but only when the selection actually changes.
   * Depending on `flat()` re-ran this on every expand and collapse -- each of
   * which rebuilds the tree state -- and snapped focus back to `selectedId`,
   * which is set once to the originally-hovered node and never moves. The user
   * could expand a row but never walk into it.
   */
  let previousSelectedId: string | undefined;
  let hasSyncedSelection = false;
  createEffect(() => {
    const selectedId = props.model.selectedId;
    if (hasSyncedSelection && selectedId === previousSelectedId) return;
    hasSyncedSelection = true;
    previousSelectedId = selectedId;
    const index = untrack(() => flat).findIndex(
      (item) => item.row.id === selectedId
    );
    if (index >= 0) setFocused(index);
  });

  createEffect(() => {
    if (props.autofocus) list?.focus({ preventScroll: true });
  });

  const moveFocus = (delta: number) => {
    const rows = untrack(() => flat);
    if (!rows.length) return;
    const next = Math.min(Math.max(focused() + delta, 0), rows.length - 1);
    setFocused(next);
    props.onHover(rows[next]!.row.id);
    list
      ?.querySelector(`[data-row-index="${next}"]`)
      ?.scrollIntoView({ block: "nearest" });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const current = flat[focused()];
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveFocus(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveFocus(-1);
        break;
      case "ArrowRight":
        if (!current) break;
        event.preventDefault();
        if (current.row.hasChildren && !props.expandedIds.has(current.row.id)) {
          props.onToggle(current.row.id);
        } else {
          moveFocus(1);
        }
        break;
      case "ArrowLeft":
        if (!current) break;
        event.preventDefault();
        if (current.row.hasChildren && props.expandedIds.has(current.row.id)) {
          props.onToggle(current.row.id);
        } else {
          moveFocus(-1);
        }
        break;
      case "Home":
        event.preventDefault();
        moveFocus(-flat.length);
        break;
      case "End":
        event.preventDefault();
        moveFocus(flat.length);
        break;
      case "Enter":
      case " ":
        if (!current?.row.source) break;
        event.preventDefault();
        props.onOpen(current.row);
        break;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        props.onClose();
        break;
    }
  };

  return (
    <div class={styles.panel} role="dialog" aria-label="Component tree">
      <div class={styles.header}>
        <Component size={13} class={styles.componentIcon} />
        <span class={styles.title}>{props.title ?? "Component tree"}</span>
        <IconButton aria-label="Close tree" onClick={() => props.onClose()}>
          <X size={14} />
        </IconButton>
      </div>

      <Show when={props.model.canGoUp}>
        <button
          type="button"
          class={styles.goUp}
          aria-label="Show parent"
          onClick={() => props.onGoUp()}
        >
          <ChevronsUp size={13} /> Show parent
        </button>
      </Show>

      <div
        ref={list}
        class={styles.body}
        role="tree"
        aria-label="Component tree"
        aria-activedescendant={
          flat[focused()]?.row.id
            ? treeItemId(flat[focused()]!.row.id)
            : undefined
        }
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseLeave={() => {
          setHovered(null);
          props.onHover(null);
        }}
      >
        <Show
          when={flat.length > 0}
          fallback={<div class={styles.empty}>Nothing to show here.</div>}
        >
          <For each={flat}>
            {(item, index) => (
              <Row
                row={item.row}
                depth={item.depth}
                index={index()}
                expanded={props.expandedIds.has(item.row.id)}
                selected={props.model.selectedId === item.row.id}
                focused={focused() === index()}
                hovered={hovered() === item.row.id}
                pending={props.pendingIds?.has(item.row.id) ?? false}
                onToggle={() => props.onToggle(item.row.id)}
                onReturnFocus={() => list?.focus({ preventScroll: true })}
                onOpen={() => props.onOpen(item.row)}
                onEnter={() => {
                  setHovered(item.row.id);
                  setFocused(index());
                  props.onHover(item.row.id);
                }}
              />
            )}
          </For>
        </Show>
      </div>

      <Show when={props.hint}>
        <div class={styles.footer}>{props.hint}</div>
      </Show>
    </div>
  );
}

function Row(props: {
  row: TreeRow;
  depth: number;
  index: number;
  expanded: boolean;
  selected: boolean;
  focused: boolean;
  hovered: boolean;
  pending: boolean;
  onToggle: () => void;
  onReturnFocus: () => void;
  onOpen: () => void;
  onEnter: () => void;
}) {
  const clickable = () => Boolean(props.row.source);
  return (
    <div
      id={treeItemId(props.row.id)}
      role="treeitem"
      data-row-index={props.index}
      data-row-kind={props.row.kind}
      aria-expanded={props.row.hasChildren ? props.expanded : undefined}
      aria-selected={props.selected}
      aria-disabled={clickable() ? undefined : true}
      class={cx(
        styles.row,
        clickable() ? styles.clickable : styles.inert,
        props.selected && styles.selected,
        props.focused && styles.focused
      )}
      style={{ "padding-left": `${0.25 + props.depth * INDENT_REM}rem` }}
      title={
        clickable()
          ? `${props.row.source!.filePath}:${props.row.source!.line}`
          : props.pending
          ? `${props.row.label} — finding source`
          : `${props.row.label} — no source location`
      }
      onMouseEnter={() => props.onEnter()}
      onClick={() => {
        if (clickable()) props.onOpen();
      }}
    >
      <Show
        when={props.row.hasChildren}
        fallback={<span class={styles.guide} aria-hidden="true" />}
      >
        <button
          type="button"
          tabIndex={-1}
          class={styles.twisty}
          aria-label={props.expanded ? "Collapse" : "Expand"}
          onClick={(event) => {
            event.stopPropagation();
            props.onToggle();
            props.onReturnFocus();
          }}
        >
          {props.expanded ? (
            <ChevronDown size={13} />
          ) : (
            <ChevronRight size={13} />
          )}
        </button>
      </Show>

      <Show
        when={props.row.kind === "component"}
        fallback={<span aria-hidden="true" />}
      >
        <Component size={12} class={styles.componentIcon} />
      </Show>

      <span
        class={cx(
          styles.label,
          props.row.kind === "component"
            ? styles.componentLabel
            : styles.elementLabel
        )}
      >
        <Show when={props.row.kind === "element"}>
          <span class={styles.bracket}>&lt;</span>
        </Show>
        {props.row.label}
        <Show when={props.row.kind === "element"}>
          <span class={styles.bracket}>&gt;</span>
        </Show>
      </span>

      <span class={styles.detail}>
        {props.pending ? "Finding source…" : props.row.detail}
      </span>

      <ExternalLink
        size={11}
        class={cx(
          styles.open,
          clickable() && (props.hovered || props.focused) && styles.openVisible
        )}
      />
    </div>
  );
}

function treeItemId(rowId: string): string {
  return `locator-treeitem-${encodeURIComponent(rowId)}`;
}
