import { css } from "@locator/styled-system/css";
import { ChevronRight } from "lucide-solid";
import { type JSX } from "solid-js";

const styles = {
  foldSection: css({
    layerStyle: "card",
    p: "3",
    // [open] sits on the <details>, so the open styles reach down to the summary.
    _open: {
      "& > summary": {
        borderBottomColor: "border",
        borderBottomWidth: "1px",
        pb: "2",
      },
      "& > summary > svg": { transform: "rotate(90deg)" },
    },
  }),
  foldSummary: css({
    alignItems: "center",
    cursor: "pointer",
    display: "flex",
    fontSize: "sm",
    fontWeight: "semibold",
    gap: "1.5",
    listStyle: "none",
    _focusVisible: { focusVisibleRing: "outside" },
    "&::-webkit-details-marker": { display: "none" },
  }),
  foldChevron: css({
    color: "fg.muted",
    flexShrink: "0",
    transition: "transform token(durations.fast) ease",
  }),
  foldBody: css({
    display: "flex",
    flexDirection: "column",
    gap: "3",
    pt: "3",
  }),
};

export function FoldableSection(props: {
  title: string;
  children: JSX.Element;
}) {
  return (
    <details class={styles.foldSection}>
      <summary class={styles.foldSummary}>
        <ChevronRight class={styles.foldChevron} size={14} />
        {props.title}
      </summary>
      <div class={styles.foldBody}>{props.children}</div>
    </details>
  );
}
