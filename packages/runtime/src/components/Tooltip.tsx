import { css, cx } from "@locator/styled-system/css";
import { group } from "@locator/styled-system/recipes";

const root = cx(group(), css({ display: "block", position: "relative" }));
const tooltip = css({
  bg: "gray.11",
  borderRadius: "l1",
  color: "gray.1",
  fontSize: "xs",
  opacity: "0",
  pointerEvents: "none",
  position: "absolute",
  px: "2",
  py: "1",
  textAlign: "center",
  transitionDuration: "300ms",
  transitionProperty: "opacity",
  visibility: "hidden",
  whiteSpace: "nowrap",
  zIndex: "tooltip",
  _groupHover: {
    opacity: "1",
    visibility: "visible",
  },
});
const positions = {
  bottom: css({
    bottom: "-7",
    left: "50%",
    transform: "translateX(-50%)",
  }),
  left: css({
    left: "-2",
    top: "50%",
    transform: "translate(-100%, -50%)",
  }),
  right: css({
    right: "-2",
    top: "50%",
    transform: "translate(100%, -50%)",
  }),
  top: css({
    left: "50%",
    top: "-7",
    transform: "translateX(-50%)",
  }),
};

export default function Tooltip(props: {
  tooltipText?: string;
  position?: "bottom" | "left" | "right" | "top";
  children: any;
}) {
  return (
    <div class={root}>
      {props.children}
      <div
        class={cx(tooltip, positions[props.position || "top"])}
        role="tooltip"
      >
        {props.tooltipText}
      </div>
    </div>
  );
}
