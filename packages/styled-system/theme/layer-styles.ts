import { defineLayerStyles } from "@pandacss/dev";

export const layerStyles = defineLayerStyles({
  card: {
    value: {
      background: "gray.surface.bg",
      borderColor: "border",
      borderRadius: "l3",
      borderWidth: "1px",
    },
  },
  disabled: {
    value: {
      cursor: "not-allowed",
      opacity: "0.67",
      filter: "grayscale(100%)",
    },
  },
});
