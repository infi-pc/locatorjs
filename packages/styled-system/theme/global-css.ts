// The runtime injects the generated CSS into a shadow root, where `html` and
// `body` match nothing — it sets its own defaults on #locatorjs-layer instead.
export const globalCss = {
  extend: {
    // Panda's reset reads these with hard-coded fallbacks (currentcolor for
    // borders, #005FCC for focus rings), so they must stay defined.
    "*": {
      "--global-color-border": "colors.border",
      "--global-color-placeholder": "colors.fg.subtle",
      "--global-color-selection": "colors.colorPalette.subtle.bg",
      "--global-color-focus-ring": "colors.colorPalette.solid.bg",
    },
    html: {
      colorPalette: "accent",
    },
    body: {
      background: "bg.default",
      color: "fg.default",
      fontFamily: "sans",
    },
    "small, sub, sup": {
      fontSize: "xs",
    },
  },
};
