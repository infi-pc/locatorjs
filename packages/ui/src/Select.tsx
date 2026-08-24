import { For, JSX, Show, createMemo, splitProps } from "solid-js";
import { Portal } from "solid-js/web";
import {
  Select as ArkSelect,
  createListCollection,
} from "@ark-ui/solid/select";
import { Check, ChevronDown } from "lucide-solid";
import { css, cx } from "@locator/styled-system/css";
import { button } from "@locator/styled-system/recipes";
import { usePortalMount } from "./PortalMount";

export type SelectItem = {
  value: string;
  label: string;
  icon?: () => JSX.Element;
  disabled?: boolean;
  title?: string;
};

const styles = {
  root: css({ display: "block", width: "100%" }),
  rootInline: css({ display: "inline-block", width: "auto" }),
  trigger: css({
    bg: "bg.default",
    colorPalette: "accent",
    justifyContent: "space-between",
    width: "100%",
    // These atoms outrank the button recipe, so its hover and active
    // backgrounds have to be restated on top of the solid background.
    _hover: { bg: "accent.outline.bg.hover" },
    _active: { bg: "accent.outline.bg.active" },
  }),
  triggerGhost: css({
    colorPalette: "gray",
    color: "fg.muted",
    justifyContent: "space-between",
    _hover: { color: "fg.default" },
  }),
  triggerLabel: css({
    alignItems: "center",
    display: "inline-flex",
    gap: "2",
    minW: "0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  positioner: css({ pointerEvents: "auto", zIndex: "popover" }),
  content: css({
    bg: "bg.default",
    borderColor: "border",
    borderRadius: "l2",
    borderWidth: "1px",
    boxShadow: "lg",
    maxH: "64",
    overflowY: "auto",
    p: "1",
    pointerEvents: "auto",
    width: "var(--reference-width)",
    // Ark reads this to derive --z-index for the positioner's inline z-index;
    // without it the dropdown renders behind dialogs.
    zIndex: "popover",
    _open: { animation: "fade-in 100ms ease-out" },
  }),
  contentInline: css({ minW: "40", width: "auto" }),
  item: css({
    alignItems: "center",
    borderRadius: "l2",
    color: "fg.default",
    cursor: "pointer",
    display: "grid",
    fontSize: "sm",
    gap: "2",
    minH: "8",
    outline: "0",
    px: "2",
    py: "1",
    textAlign: "left",
    width: "100%",
    _highlighted: { bg: "accent.subtle.bg" },
    _selected: { color: "accent.plain.fg" },
    _disabled: { cursor: "not-allowed", opacity: "0.5" },
  }),
  itemWithIcon: css({ gridTemplateColumns: "1rem minmax(0, 1fr) 1rem" }),
  itemNoIcon: css({ gridTemplateColumns: "minmax(0, 1fr) 1rem" }),
  icon: css({
    alignItems: "center",
    color: "fg.muted",
    display: "inline-flex",
    height: "4",
    justifyContent: "center",
    width: "4",
  }),
  check: css({ color: "accent.plain.fg", height: "4", width: "4" }),
};

export function Select(
  props: {
    items: SelectItem[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    portalMount?: Node;
    class?: string;
    variant?: "outline" | "ghost";
    size?: "xs" | "sm";
  } & Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value">
) {
  const [local, triggerProps] = splitProps(props, [
    "items",
    "value",
    "onChange",
    "placeholder",
    "disabled",
    "portalMount",
    "class",
    "variant",
    "size",
    "id",
  ]);
  const ghost = () => local.variant === "ghost";
  const portalMount = usePortalMount(() => local.portalMount);
  const hasIcons = () => local.items.some((item) => item.icon);
  const collection = createMemo(() =>
    createListCollection<SelectItem>({
      items: local.items,
      itemToString: (item) => item.label,
      itemToValue: (item) => item.value,
      isItemDisabled: (item) => !!item.disabled,
    })
  );
  const selected = () => local.items.find((item) => item.value === local.value);

  return (
    <ArkSelect.Root
      ids={local.id ? { trigger: local.id } : undefined}
      class={cx(ghost() ? styles.rootInline : styles.root, local.class)}
      collection={collection()}
      value={local.value ? [local.value] : []}
      disabled={local.disabled}
      positioning={{
        placement: "bottom-start",
        sameWidth: !ghost(),
        strategy: "fixed",
      }}
      onValueChange={(details) => {
        const next = details.value[0];
        if (next != null) local.onChange(next);
      }}
    >
      <ArkSelect.HiddenSelect />
      <ArkSelect.Control>
        <ArkSelect.Trigger
          class={cx(
            button({
              variant: ghost() ? "plain" : "outline",
              size: local.size ?? "sm",
            }),
            ghost() ? styles.triggerGhost : styles.trigger
          )}
          {...triggerProps}
        >
          <span class={styles.triggerLabel}>
            <Show when={selected()?.icon}>
              <span class={styles.icon}>{selected()?.icon?.()}</span>
            </Show>
            {selected()?.label ?? local.placeholder ?? "Select"}
          </span>
          <ArkSelect.Indicator>
            <ChevronDown size={16} />
          </ArkSelect.Indicator>
        </ArkSelect.Trigger>
      </ArkSelect.Control>
      <Portal mount={portalMount()}>
        <ArkSelect.Positioner class={styles.positioner}>
          <ArkSelect.Content
            class={cx(styles.content, ghost() && styles.contentInline)}
          >
            <ArkSelect.List>
              <For each={local.items}>
                {(item) => (
                  <ArkSelect.Item
                    item={item}
                    title={item.title}
                    class={cx(
                      styles.item,
                      hasIcons() ? styles.itemWithIcon : styles.itemNoIcon
                    )}
                  >
                    <Show when={hasIcons()}>
                      <span class={styles.icon}>{item.icon?.()}</span>
                    </Show>
                    <ArkSelect.ItemText>{item.label}</ArkSelect.ItemText>
                    <ArkSelect.ItemIndicator>
                      <Check class={styles.check} />
                    </ArkSelect.ItemIndicator>
                  </ArkSelect.Item>
                )}
              </For>
            </ArkSelect.List>
          </ArkSelect.Content>
        </ArkSelect.Positioner>
      </Portal>
    </ArkSelect.Root>
  );
}
