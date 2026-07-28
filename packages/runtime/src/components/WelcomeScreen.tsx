import { LinkProps } from "../types/types";
import { DEFAULT_LAYER, Targets } from "@locator/shared";
import { LayeredOptionsEditor, LayerTabConfig } from "@locator/ui";
import { useOptions } from "../functions/optionsStore";
import { AdapterId, HREF_TARGET } from "../consts";
import { buildLink } from "../functions/buildLink";
import { css, cx } from "@locator/styled-system/css";
import { button } from "@locator/styled-system/recipes";

const styles = {
  dialog: css({
    bg: "bg.default",
    borderColor: "red.9",
    borderRadius: "l3",
    borderWidth: "2px",
    boxShadow: "xl",
    cursor: "auto",
    maxH: "100%",
    maxW: "xl",
    overflow: "auto",
    p: "4",
    pointerEvents: "auto",
    zIndex: "popover",
  }),
  intro: css({ mb: "4", mt: "2" }),
  title: css({ fontSize: "2xl", fontWeight: "bold" }),
  description: css({ fontSize: "sm" }),
  footer: css({
    alignItems: "center",
    display: "flex",
    gap: "2",
    justifyContent: "flex-end",
    mt: "4",
  }),
  testLink: cx(
    button({ variant: "solid", size: "sm" }),
    css({ colorPalette: "violet" })
  ),
  confirm: cx(
    button({ variant: "solid", size: "sm" }),
    css({ colorPalette: "blue" })
  ),
};

export function WelcomeScreen(props: {
  originalLinkProps: LinkProps | null;
  targets: Targets;
  onClose: () => void;
  adapterId?: AdapterId;
  portalMount: HTMLDivElement;
}) {
  const options = useOptions();
  const tabs = (): LayerTabConfig[] => [
    {
      layer: "user-origin",
      label: "This origin",
      values: options.layers()["user-origin"] ?? {},
      write: options.setUserOrigin,
      note: "Adjust this origin until the test link opens the correct source file.",
    },
    {
      layer: "user-extension",
      label: "Extension",
      values: options.layers()["user-extension"] ?? {},
    },
    { layer: "team", label: "Team", values: options.layers().team ?? {} },
    {
      layer: "default",
      label: "Defaults",
      values: options.layers().default ?? DEFAULT_LAYER,
    },
  ];

  const currentLink = () => {
    const eff = options.effective();
    return props.originalLinkProps
      ? buildLink(
          props.originalLinkProps,
          props.targets,
          options,
          eff.targetTemplate ?? eff.targetId
        )
      : undefined;
  };

  return (
    <div class={styles.dialog}>
      <div class={styles.intro}>
        <h1 class={styles.title}>Welcome to Locator!</h1>
        <span class={styles.description}>
          Before using Locator, let's try links in your project and fix them if
          needed.
        </span>
      </div>
      <LayeredOptionsEditor
        tabs={tabs()}
        targets={options.allTargets()}
        defaultId="user-origin"
        portalMount={props.portalMount}
      />

      <div class={styles.footer}>
        <a
          href={currentLink()}
          target={options.effective().hrefTarget || HREF_TARGET}
          class={styles.testLink}
        >
          Test link
        </a>
        <button
          onClick={() => {
            options.setUiState({ welcomeScreenDismissed: true });
            props.onClose();
          }}
          class={styles.confirm}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}
