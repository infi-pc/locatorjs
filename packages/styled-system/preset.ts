import { definePreset } from "@pandacss/dev";
import pandaPreset from "@pandacss/dev/presets";
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
import { amber } from "./theme/colors/amber";
import { blue } from "./theme/colors/blue";
import { neutral } from "./theme/colors/neutral";
import { red } from "./theme/colors/red";
import { teal } from "./theme/colors/teal";
import { violet } from "./theme/colors/violet";

export const preset = definePreset({
  presets: [pandaPreset],
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
        gradients: {
          brand: {
            value: "linear-gradient(135deg, {colors.red.9}, {colors.violet.9})",
          },
        },
        fonts: {
          sans: {
            value:
              'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          },
          mono: {
            value:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          },
          code: { value: "{fonts.mono}" },
        },
        radii: {
          l1: { value: "{radii.sm}" },
          l2: { value: "{radii.md}" },
          l3: { value: "{radii.lg}" },
        },
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
          bg: {
            default: {
              value: { _light: "{colors.white}", _dark: "{colors.gray.1}" },
            },
            subtle: {
              value: { _light: "{colors.gray.2}", _dark: "{colors.gray.2}" },
            },
            muted: {
              value: { _light: "{colors.gray.3}", _dark: "{colors.gray.3}" },
            },
          },
          error: {
            value: { _light: "{colors.red.9}", _dark: "{colors.red.9}" },
          },
          gray: neutral,
          accent: violet,
          violet,
          blue,
          teal,
          amber,
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
