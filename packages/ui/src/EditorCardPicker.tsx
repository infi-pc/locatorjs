import { For, JSX } from "solid-js";
import { strictConfig } from "@locator/shared";
import { css, cx } from "@locator/styled-system/css";
import { editorIconFor } from "./editorIcons";

const CUSTOM_VALUE = "__custom__";

const styles = {
  grid: css({
    display: "grid",
    gap: "2",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  }),
  card: css({
    alignItems: "center",
    bg: "bg.default",
    borderColor: "border",
    borderRadius: "l2",
    borderWidth: "1px",
    cursor: "pointer",
    display: "flex",
    fontSize: "sm",
    fontWeight: "medium",
    gap: "2",
    p: "3",
    textAlign: "left",
    _hover: { borderColor: "accent.outline.border", bg: "gray.subtle.bg" },
    _focusVisible: { focusVisibleRing: "outside" },
  }),
  cardSelected: css({
    borderColor: "violet.9",
    bg: "accent.subtle.bg",
    color: "accent.subtle.fg",
  }),
  icon: css({ flexShrink: "0" }),
};

export function EditorCardPicker(props: {
  targets: strictConfig.TargetViewMap;
  value?: strictConfig.EditorDestination;
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  const selected = () =>
    props.value?.kind === "template" ||
    (props.value?.kind === "target" && !props.targets[props.value.id])
      ? CUSTOM_VALUE
      : props.value?.kind === "target"
      ? props.value.id
      : undefined;

  const entries = (): [string, strictConfig.TargetView][] =>
    Object.entries(props.targets);

  return (
    <div class={styles.grid} aria-label="Editor">
      <For each={entries()}>
        {([value, target]) => (
          <button
            type="button"
            aria-pressed={selected() === value}
            disabled={props.disabled}
            class={cx(styles.card, selected() === value && styles.cardSelected)}
            onClick={() => props.onSelect(value)}
          >
            <span class={styles.icon} aria-hidden="true">
              {editorIconFor(value) as JSX.Element}
            </span>
            {target.label}
          </button>
        )}
      </For>
      <button
        type="button"
        aria-pressed={selected() === CUSTOM_VALUE}
        disabled={props.disabled}
        class={cx(
          styles.card,
          selected() === CUSTOM_VALUE && styles.cardSelected
        )}
        onClick={() => props.onSelect(CUSTOM_VALUE)}
      >
        <span class={styles.icon} aria-hidden="true">
          {editorIconFor("custom") as JSX.Element}
        </span>
        Custom link
      </button>
    </div>
  );
}

export const EDITOR_CARD_CUSTOM = CUSTOM_VALUE;
