import { For, createMemo } from "solid-js";
import { isMac, strictConfig } from "@locator/shared";
import { css, cx } from "@locator/styled-system/css";

const ORDER = ["alt", "ctrl", "shift", "meta"] as const;
type Modifier = strictConfig.Modifier;

export type ModifierChipsVariant = "compact" | "full";
export type ModifierChipsPlatform = "mac" | "windows";

const MODIFIER_LABELS: Record<
  ModifierChipsPlatform,
  Record<Modifier, { compact: string; legend: string; name: string }>
> = {
  mac: {
    alt: { compact: "⌥ Option", legend: "⌥", name: "option" },
    ctrl: { compact: "⌃ Ctrl", legend: "⌃", name: "control" },
    shift: { compact: "⇧ Shift", legend: "⇧", name: "shift" },
    meta: { compact: "⌘ Command", legend: "⌘", name: "command" },
  },
  windows: {
    alt: { compact: "Alt", legend: "Alt", name: "alt" },
    ctrl: { compact: "Ctrl", legend: "Ctrl", name: "control" },
    shift: { compact: "Shift", legend: "⇧", name: "shift" },
    meta: { compact: "⊞ Win", legend: "⊞", name: "windows" },
  },
};

const styles = {
  row: css({ display: "flex", flexWrap: "wrap", gap: "1.5" }),
  fullRow: css({ gap: "2" }),
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
  fullChip: css({
    alignItems: "stretch",
    bg: "bg.default",
    borderColor: "gray.surface.border",
    borderRadius: "l2",
    boxShadow:
      "inset 0 -2px 0 color-mix(in srgb, var(--colors-gray-300) 65%, transparent), 0 1px 2px rgb(0 0 0 / 0.08)",
    flexDirection: "column",
    fontFamily: "sans",
    h: "14",
    justifyContent: "space-between",
    minW: "17",
    px: "3",
    py: "2",
    _hover: {
      bg: "gray.subtle.bg",
      borderColor: "gray.surface.border.hover",
    },
    _pressed: {
      bg: "accent.subtle.bg",
      borderColor: "accent.outline.border",
      boxShadow: "inset 0 1px 2px rgb(0 0 0 / 0.12)",
      color: "accent.subtle.fg",
      transform: "translateY(1px)",
    },
  }),
  fullChipWide: css({ minW: "22" }),
  legend: css({
    alignSelf: "flex-start",
    fontSize: "lg",
    fontWeight: "medium",
    letterSpacing: "tight",
    lineHeight: "1",
  }),
  keyName: css({
    alignSelf: "flex-start",
    color: "fg.muted",
    fontSize: "xs",
    fontWeight: "normal",
    letterSpacing: "normal",
    lineHeight: "1",
    textTransform: "lowercase",
  }),
};

export function ModifierChips(props: {
  value?: readonly Modifier[];
  disabled?: boolean;
  variant?: ModifierChipsVariant;
  platform?: ModifierChipsPlatform;
  onChange: (value: readonly [Modifier, ...Modifier[]] | undefined) => void;
}) {
  const selected = createMemo(() => new Set(props.value ?? []));
  const variant = () => props.variant ?? "compact";
  const platform = () => props.platform ?? (isMac ? "mac" : "windows");

  return (
    <div class={cx(styles.row, variant() === "full" && styles.fullRow)}>
      <For each={ORDER}>
        {(key) => {
          const pressed = () => selected().has(key);
          const label = () => MODIFIER_LABELS[platform()][key];
          return (
            <button
              type="button"
              class={cx(
                styles.chip,
                variant() === "full" && styles.fullChip,
                variant() === "full" &&
                  (key === "shift" || key === "meta") &&
                  styles.fullChipWide
              )}
              aria-label={label().compact}
              aria-pressed={pressed()}
              disabled={props.disabled}
              onClick={() => {
                const next = new Set(selected());
                if (next.has(key)) {
                  next.delete(key);
                } else {
                  next.add(key);
                }
                const ordered = ORDER.filter((modifier) => next.has(modifier));
                props.onChange(
                  ordered.length
                    ? [ordered[0]!, ...ordered.slice(1)]
                    : undefined
                );
              }}
            >
              {variant() === "full" ? (
                <>
                  <span class={styles.legend} aria-hidden="true">
                    {label().legend}
                  </span>
                  <span class={styles.keyName} aria-hidden="true">
                    {label().name}
                  </span>
                </>
              ) : (
                label().compact
              )}
            </button>
          );
        }}
      </For>
    </div>
  );
}
