import { For } from "solid-js";
import { css } from "@locator/styled-system/css";

export type PromoHint = {
  text: string;
  href: string;
  linkLabel?: string;
};

const styles = {
  root: css({
    borderColor: "border",
    borderRadius: "l2",
    borderWidth: "1px",
    color: "fg.muted",
    display: "flex",
    flexDirection: "column",
    fontSize: "xs",
    gap: "1.5",
    p: "3",
  }),
  link: css({
    color: "accent.plain.fg",
    textDecoration: "underline",
    _hover: { color: "accent.solid.bg.hover" },
  }),
};

export function PromoFooter(props: { promos: PromoHint[] }) {
  return (
    <div class={styles.root}>
      <For each={props.promos}>
        {(promo) => (
          <div>
            {promo.text}{" "}
            <a class={styles.link} href={promo.href} target="_blank">
              {promo.linkLabel ?? "Learn more"}
            </a>
          </div>
        )}
      </For>
    </div>
  );
}
