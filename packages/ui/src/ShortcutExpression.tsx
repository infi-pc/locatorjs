import { getModifiersMap, modifiersTitles } from "@locator/shared";
import { css } from "@locator/styled-system/css";
import { For } from "solid-js";

const styles = {
  expression: css({
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "1",
    minW: "0",
  }),
  token: css({
    bg: "bg.default",
    borderColor: "border",
    borderRadius: "l1",
    borderWidth: "1px",
    boxShadow: "xs",
    color: "fg.default",
    display: "inline-flex",
    flexShrink: "0",
    fontSize: "xs",
    fontWeight: "semibold",
    lineHeight: "1",
    minH: "6",
    px: "1.5",
    alignItems: "center",
  }),
  plus: css({ color: "fg.subtle", fontSize: "xs" }),
  srOnly: css({
    border: "0",
    clip: "rect(0, 0, 0, 0)",
    h: "1px",
    m: "-1px",
    overflow: "hidden",
    p: "0",
    position: "absolute",
    whiteSpace: "nowrap",
    w: "1px",
  }),
};

export function modifierText(value: string) {
  return Object.keys(getModifiersMap(value))
    .map((key) => modifiersTitles[key as keyof typeof modifiersTitles] ?? key)
    .join(" + ");
}

export function ShortcutExpression(props: { modifiers: string }) {
  const labels = () =>
    modifierText(props.modifiers).split(" + ").filter(Boolean);
  const accessibleLabel = () => `${modifierText(props.modifiers)} + Click`;

  return (
    <span class={styles.expression} aria-label={accessibleLabel()}>
      <span class={styles.srOnly}>{accessibleLabel()}</span>
      <span aria-hidden="true" class={styles.expression}>
        <For each={labels()}>
          {(label, index) => (
            <>
              {index() > 0 && <span class={styles.plus}>+</span>}
              <span class={styles.token}>{label}</span>
            </>
          )}
        </For>
        <span class={styles.plus}>+</span>
        <span class={styles.token}>Click</span>
      </span>
    </span>
  );
}
