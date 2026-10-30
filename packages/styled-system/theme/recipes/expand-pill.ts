import { defineRecipe } from "@pandacss/dev";

export const expandPill = defineRecipe({
  className: "expand-pill",
  base: {
    appearance: "none",
    bg: "gray.subtle.bg",
    borderRadius: "full",
    cursor: "pointer",
    display: "inline-flex",
    font: "inherit",
    lineHeight: "1",
    px: "2",
    py: "0",
    _hover: {
      bg: "gray.subtle.bg.hover",
    },
  },
});
