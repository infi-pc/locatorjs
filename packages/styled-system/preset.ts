import { definePreset } from "@pandacss/dev";
import { animationStyles } from "./theme/animation-styles";
import { conditions } from "./theme/conditions";
import { globalCss } from "./theme/global-css";
import { keyframes } from "./theme/keyframes";
import { layerStyles } from "./theme/layer-styles";
import { recipes, slotRecipes } from "./theme/recipes";
import { textStyles } from "./theme/text-styles";
import { colors } from "./theme/tokens/colors";
import { durations } from "./theme/tokens/durations";
import { shadows } from "./theme/tokens/shadows";
import { zIndex } from "./theme/tokens/z-index";
import { green } from "./theme/colors/green";
import { neutral } from "./theme/colors/neutral";
import { red } from "./theme/colors/red";

export const preset = definePreset({
  globalCss,
  theme: {
    extend: {
      animationStyles,
      recipes,
      slotRecipes,
      keyframes,
      layerStyles,
      textStyles,
      tokens: {
        colors,
        durations,
        zIndex,
      },
      semanticTokens: {
        colors: {
          fg: {
            default: {
              value: {
                _light: "{colors.gray.12}",
                _dark: "{colors.gray.12}",
              },
            },
            muted: {
              value: {
                _light: "{colors.gray.11}",
                _dark: "{colors.gray.11}",
              },
            },
            subtle: {
              value: {
                _light: "{colors.gray.10}",
                _dark: "{colors.gray.10}",
              },
            },
          },
          border: {
            value: { _light: "{colors.gray.4}", _dark: "{colors.gray.4}" },
          },
          error: {
            value: { _light: "{colors.red.9}", _dark: "{colors.red.9}" },
          },
          gray: neutral,
          green,
          red,
        },
        shadows,
      },
    },
  },
  conditions: {
    extend: {
      ...conditions.extend,
      dark: "@media (prefers-color-scheme: dark)",
      light: "@media (prefers-color-scheme: light)",
    },
  },
});
