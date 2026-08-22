import {
  MAX_BINDINGS_PER_TRIGGER,
  bindingsForTrigger,
  duplicateShortcutModifiers,
  globalIndexForTrigger,
  type Binding,
  type BindingTrigger,
  type EditorSelection,
  type Targets,
} from "@locator/shared";
import { css, cx } from "@locator/styled-system/css";
import { ArrowRight, Plus } from "lucide-solid";
import { For, Show } from "solid-js";
import { actionIconFor, actionLabel } from "./actionIcons";
import { HoverToolbarButton, HoverToolbarFrame } from "./HoverToolbar";
import { ShortcutExpression } from "./ShortcutExpression";

export type StudioSelection = {
  triggerKind: BindingTrigger["kind"];
  index: number;
};

const styles = {
  workspace: css({
    borderColor: "border",
    borderRadius: "l3",
    borderWidth: "1px",
    display: "block",
    overflow: "hidden",
  }),
  map: css({
    bg: "gray.subtle.bg",
    display: "flex",
    flexDirection: "column",
    gap: "4",
    minW: "0",
    p: "3",
  }),
  section: css({ display: "flex", flexDirection: "column", gap: "2" }),
  sectionHeader: css({
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
  }),
  heading: css({
    color: "fg.muted",
    fontSize: "xs",
    fontWeight: "semibold",
    letterSpacing: "wide",
    textTransform: "uppercase",
  }),
  count: css({ color: "fg.subtle", fontSize: "xs" }),
  rows: css({ display: "flex", flexDirection: "column", gap: "1" }),
  row: css({
    alignItems: "center",
    appearance: "none",
    bg: "bg.default",
    borderColor: "border",
    borderRadius: "l2",
    borderWidth: "1px",
    cursor: "pointer",
    display: "grid",
    gap: "2",
    gridTemplateColumns: "minmax(0, 1.25fr) auto minmax(0, 1fr)",
    minH: "11",
    px: "2",
    textAlign: "left",
    width: "100%",
    _hover: { borderColor: "accent.outline.border" },
    _focusVisible: { focusVisibleRing: "outside" },
  }),
  selected: css({
    borderColor: "accent.outline.border",
    boxShadow: "0 0 0 1px var(--colors-accent-outline-border)",
  }),
  arrow: css({ color: "fg.subtle" }),
  action: css({
    alignItems: "center",
    display: "flex",
    fontSize: "xs",
    gap: "1.5",
    minW: "0",
  }),
  actionLabel: css({
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  warning: css({ color: "amber.plain.fg", fontWeight: "bold" }),
  addRow: css({
    alignItems: "center",
    appearance: "none",
    borderColor: "border",
    borderRadius: "l2",
    borderStyle: "dashed",
    borderWidth: "1px",
    color: "fg.muted",
    cursor: "pointer",
    display: "flex",
    fontSize: "xs",
    gap: "2",
    justifyContent: "center",
    minH: "9",
    width: "100%",
    _hover: { bg: "bg.default", color: "fg.default" },
    _focusVisible: { focusVisibleRing: "outside" },
    _disabled: { cursor: "not-allowed", opacity: "0.5" },
  }),
  toolbarStage: css({
    alignItems: "center",
    display: "flex",
    gap: "2",
    minH: "14",
  }),
  toolbarAdd: css({
    alignItems: "center",
    appearance: "none",
    bg: "bg.default",
    borderColor: "border",
    borderRadius: "l2",
    borderWidth: "1px",
    color: "fg.muted",
    cursor: "pointer",
    display: "inline-flex",
    flexShrink: "0",
    h: "10",
    justifyContent: "center",
    w: "10",
    _hover: { color: "fg.default", borderColor: "accent.outline.border" },
    _focusVisible: { focusVisibleRing: "outside" },
    _disabled: { cursor: "not-allowed", opacity: "0.5" },
  }),
  empty: css({ color: "fg.subtle", fontSize: "xs", py: "3" }),
};

export function InteractionStudio(props: {
  bindings: Binding[];
  targets: Targets;
  editor?: EditorSelection;
  selection?: StudioSelection;
  onSelect: (selection: StudioSelection) => void;
  onAdd: (kind: BindingTrigger["kind"]) => void;
}) {
  const shortcuts = () => bindingsForTrigger(props.bindings, "modifier-click");
  const toolbar = () => bindingsForTrigger(props.bindings, "hover-toolbar");
  const duplicate = (binding: Binding) => {
    if (binding.trigger.kind !== "modifier-click") return false;
    return duplicateShortcutModifiers(props.bindings).has(
      binding.trigger.modifiers
    );
  };

  return (
    <div class={styles.workspace}>
      <div class={styles.map} aria-label="Interaction map">
        <section class={styles.section}>
          <div class={styles.sectionHeader}>
            <h2 class={styles.heading}>Shortcuts</h2>
            <span class={styles.count}>{shortcuts().length} rules</span>
          </div>
          <div class={styles.rows}>
            <For each={shortcuts()}>
              {(binding, index) => {
                const selected = () =>
                  props.selection?.triggerKind === "modifier-click" &&
                  props.selection.index === index();
                const label = () =>
                  actionLabel(binding.action, props.targets, props.editor);
                const itemIndex = () =>
                  globalIndexForTrigger(
                    props.bindings,
                    "modifier-click",
                    index()
                  );
                return (
                  <button
                    type="button"
                    class={cx(styles.row, selected() && styles.selected)}
                    aria-label={`Edit action ${itemIndex() + 1}: ${label()}`}
                    aria-pressed={selected()}
                    onClick={() =>
                      props.onSelect({
                        triggerKind: "modifier-click",
                        index: index(),
                      })
                    }
                  >
                    <ShortcutExpression
                      modifiers={
                        binding.trigger.kind === "modifier-click"
                          ? binding.trigger.modifiers
                          : ""
                      }
                    />
                    <ArrowRight size={13} class={styles.arrow} />
                    <span class={styles.action}>
                      {actionIconFor(
                        binding.action,
                        props.targets,
                        props.editor
                      )}
                      <span class={styles.actionLabel}>{label()}</span>
                      <Show when={duplicate(binding)}>
                        <span class={styles.warning} title="Duplicate shortcut">
                          !
                        </span>
                      </Show>
                    </span>
                  </button>
                );
              }}
            </For>
            <button
              type="button"
              class={styles.addRow}
              aria-label="Add modifier + click action"
              disabled={shortcuts().length >= MAX_BINDINGS_PER_TRIGGER}
              onClick={() => props.onAdd("modifier-click")}
            >
              <Plus size={13} /> Add shortcut
            </button>
          </div>
        </section>

        <section class={styles.section}>
          <div class={styles.sectionHeader}>
            <h2 class={styles.heading}>Hover toolbar</h2>
          </div>
          <div class={styles.toolbarStage}>
            <HoverToolbarFrame aria-label="Configured hover toolbar">
              <Show
                when={toolbar().length > 0}
                fallback={<span class={styles.empty}>No buttons</span>}
              >
                <For each={toolbar()}>
                  {(binding, index) => {
                    const selected = () =>
                      props.selection?.triggerKind === "hover-toolbar" &&
                      props.selection.index === index();
                    const label = () =>
                      actionLabel(binding.action, props.targets, props.editor);
                    const itemIndex = () =>
                      globalIndexForTrigger(
                        props.bindings,
                        "hover-toolbar",
                        index()
                      );
                    return (
                      <HoverToolbarButton
                        selected={selected()}
                        aria-label={`Edit action ${
                          itemIndex() + 1
                        }: ${label()}`}
                        title={label()}
                        onClick={() =>
                          props.onSelect({
                            triggerKind: "hover-toolbar",
                            index: index(),
                          })
                        }
                      >
                        {actionIconFor(
                          binding.action,
                          props.targets,
                          props.editor
                        )}
                      </HoverToolbarButton>
                    );
                  }}
                </For>
              </Show>
            </HoverToolbarFrame>
            <button
              type="button"
              class={styles.toolbarAdd}
              aria-label="Add hover toolbar action"
              title="Add hover toolbar action"
              disabled={toolbar().length >= MAX_BINDINGS_PER_TRIGGER}
              onClick={() => props.onAdd("hover-toolbar")}
            >
              <Plus size={15} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
