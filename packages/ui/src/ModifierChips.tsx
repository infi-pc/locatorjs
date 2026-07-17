import { For, createMemo } from "solid-js";
import {
  getModifiersMap,
  getModifiersString,
  modifiersTitles,
} from "@locator/shared";
import { css, cx } from "@locator/styled-system/css";

const ORDER = ["alt", "ctrl", "shift", "meta"] as const;

const styles = {
  row: css({ display: "flex", flexWrap: "wrap", gap: "1.5" }),
  chip: css({
    alignItems: "center",
    bg: "gray.surface.bg",
    borderColor: "gray.surface.border",
    borderRadius: "l2",
    borderWidth: "1px",
    color: "fg.default",
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "mono",
    fontSize: "xs",
    fontWeight: "medium",
    h: "7",
    justifyContent: "center",
    minW: "7",
    px: "2",
    _focusVisible: { focusVisibleRing: "outside" },
    _hover: { borderColor: "gray.surface.border.hover" },
    _pressed: {
      bg: "accent.subtle.bg",
      borderColor: "accent.outline.border",
      color: "accent.subtle.fg",
    },
  }),
};

function modifierLabel(key: (typeof ORDER)[number]) {
  if (key === "meta" && modifiersTitles.meta === "Windows") return "⊞ Win";
  return modifiersTitles[key];
}

export function ModifierChips(props: {
  value?: string;
  disabled?: boolean;
  onChange: (value: string | undefined) => void;
}) {
  const map = createMemo(() => getModifiersMap(props.value ?? ""));
  return (
    <div class={styles.row}>
      <For each={ORDER}>
        {(key) => {
          const pressed = () => !!map()[key];
          return (
            <button
              type="button"
              class={cx(styles.chip)}
              aria-pressed={pressed()}
              disabled={props.disabled}
              onClick={() => {
                const next = { ...map() };
                if (next[key]) {
                  delete next[key];
                } else {
                  next[key] = true;
                }
                props.onChange(getModifiersString(next) || undefined);
              }}
            >
              {modifierLabel(key)}
            </button>
          );
        }}
      </For>
    </div>
  );
}
