import { css, cx } from "@locator/styled-system/css";
import { button } from "@locator/styled-system/recipes";

const className = cx(
  button({ variant: "plain", size: "2xs" }),
  css({
    colorPalette: "gray",
    color: "inherit",
    height: "auto",
    minWidth: "auto",
    p: "1",
    _hover: {
      bg: "white/30",
      color: "gray.2",
    },
  })
);

export function Button(props: { onClick: () => void; children: any }) {
  return (
    <button
      class={className}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        props.onClick();
      }}
    >
      {props.children}
    </button>
  );
}
