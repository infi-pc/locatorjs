import { Show } from "solid-js";
import type { Targets } from "@locator/shared";
import { css } from "@locator/styled-system/css";
import { HREF_TARGET } from "../consts";
import { buildLink } from "../functions/buildLink";
import { useOptions } from "../functions/optionsStore";
import type { LinkProps } from "../types/types";

const styles = {
  root: css({
    bg: "accent.subtle.bg",
    borderColor: "accent.outline.border",
    borderRadius: "l3",
    borderWidth: "1px",
    color: "accent.subtle.fg",
    display: "flex",
    flexDirection: "column",
    gap: "1",
    minW: "0",
    p: "3",
  }),
  label: css({ fontSize: "xs", fontWeight: "semibold" }),
  link: css({
    color: "fg.default",
    fontFamily: "mono",
    fontSize: "xs",
    overflow: "hidden",
    textDecoration: "underline",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  }),
  empty: css({ color: "fg.muted", fontFamily: "mono", fontSize: "xs" }),
};

export function LinkPreview(props: {
  linkProps: LinkProps | null;
  targets: Targets;
}) {
  const options = useOptions();
  const selectedTarget = () =>
    options.effective().targetTemplate ?? options.effective().targetId;
  const link = () =>
    props.linkProps
      ? buildLink(props.linkProps, props.targets, options, selectedTarget())
      : undefined;

  return (
    <div class={styles.root}>
      <div class={styles.label}>Live link preview</div>
      <Show
        when={link()}
        fallback={
          <div class={styles.empty}>Hover an element to preview its link</div>
        }
      >
        {(current) => (
          <a
            href={current()}
            target={options.effective().hrefTarget || HREF_TARGET}
            class={styles.link}
            title={current()}
          >
            {middleEllipsis(current())}
          </a>
        )}
      </Show>
    </div>
  );
}

function middleEllipsis(value: string) {
  if (value.length <= 96) return value;
  return `${value.slice(0, 48)}…${value.slice(-36)}`;
}
