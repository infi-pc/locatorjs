import {
  clearUserOriginOptions,
  DEFAULT_LAYER,
  Targets,
} from "@locator/shared";
import { createMemo, createSignal, createEffect } from "solid-js";
import { Button, LayeredOptionsEditor, LayerTabConfig } from "@locator/ui";
import { css, cx } from "@locator/styled-system/css";
import { bannerClasses } from "../functions/bannerClasses";
import { isExtension } from "../functions/isExtension";
import LogoIcon from "./LogoIcon";
import { OptionsCloseButton } from "./OptionsCloseButton";
import { useOptions } from "../functions/optionsStore";
import { AdapterId } from "../consts";
import { LinkOptions } from "./LinkOptions";
import {
  getElementInfo,
  getElementInfoAsync,
} from "../adapters/getElementInfo";
import { LinkProps } from "../types/types";

const styles = {
  panel: css({
    maxWidth: "100%",
    width: "560px",
  }),
  inner: css({ p: "1" }),
  header: css({
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
  }),
  details: css({ mt: "4", mb: "2" }),
  summary: css({
    color: "fg.default",
    cursor: "pointer",
    fontSize: "sm",
    fontWeight: "medium",
    userSelect: "none",
  }),
  detailsContent: css({ mt: "2" }),
  footer: css({
    display: "flex",
    gap: "2",
    justifyContent: "space-between",
    mt: "2",
  }),
  disableIcon: css({ width: "16px", height: "16px" }),
};

export function Options(props: {
  targets: Targets;
  onClose: () => void;
  showDisableDialog: () => void;
  adapterId?: AdapterId;
  currentElement: HTMLElement | null;
}) {
  const options = useOptions();

  // Synchronously fetched linkProps
  const syncLinkProps = createMemo(() =>
    props.currentElement
      ? getElementInfo(props.currentElement, props.adapterId)?.thisElement
          .link || null
      : null
  );

  // Async fetched linkProps (for Turbopack jsxDEV source)
  const [asyncLinkProps, setAsyncLinkProps] = createSignal<LinkProps | null>(
    null
  );

  // When currentElement changes and sync fails, try async
  createEffect(() => {
    const element = props.currentElement;
    const syncResult = syncLinkProps();

    // If sync succeeded, use sync result directly
    if (syncResult) {
      setAsyncLinkProps(null);
      return;
    }

    // Sync failed, try async
    if (element) {
      getElementInfoAsync(element, props.adapterId)
        .then((elInfo) => {
          // Ensure element is still the current element
          if (props.currentElement === element) {
            setAsyncLinkProps(elInfo?.thisElement.link || null);
          }
        })
        .catch(() => {
          // Async resolution failed — leave as null
        });
    } else {
      setAsyncLinkProps(null);
    }
  });

  // Prefer sync result, fallback to async result
  const elLinkProps = () => syncLinkProps() || asyncLinkProps();

  const layerTabs = (): LayerTabConfig[] => [
    {
      layer: "user-origin",
      label: "This origin",
      values: options.layers()["user-origin"] ?? {},
      write: options.setUserOrigin,
      note: "Stored in this page’s origin — applies to everyone opening it in this browser profile.",
    },
    {
      layer: "user-extension",
      label: "Extension",
      values: options.layers()["user-extension"] ?? {},
      note: isExtension()
        ? "Your extension defaults — change them in the extension popup."
        : "Install the browser extension to set personal cross-site defaults.",
    },
    {
      layer: "team",
      label: "Team",
      values: options.layers().team ?? {},
      note: "Defined by setup() in the app’s code — change it in the repository.",
    },
    {
      layer: "default",
      label: "Defaults",
      values: options.layers().default ?? DEFAULT_LAYER,
      note: "Built-in LocatorJS defaults.",
    },
  ];

  return (
    <div
      class={cx(bannerClasses(), styles.panel)}
      style={{
        "max-height": "calc(100vh - 32px)",
        "overflow-y": "auto",
        "overflow-x": "hidden",
        "overscroll-behavior": "contain",
      }}
      onWheel={(e) => e.stopPropagation()}
    >
      <div class={styles.inner}>
        <div class={styles.header}>
          <LogoIcon />
          <OptionsCloseButton onClick={() => props.onClose()} />
        </div>

        <LinkOptions
          linkProps={elLinkProps()}
          adapterId={props.adapterId}
          targets={props.targets}
        />

        <details class={styles.details}>
          <summary class={styles.summary}>All settings by layer</summary>
          <div class={styles.detailsContent}>
            <LayeredOptionsEditor
              tabs={layerTabs()}
              effective={options.effective()}
              provenance={options.provenance()}
              targets={options.allTargets()}
            />
          </div>
        </details>

        <div class={styles.footer}>
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              clearUserOriginOptions();
              props.onClose();
            }}
          >
            Reset settings
          </Button>
          <Button
            size="xs"
            variant="danger-ghost"
            onClick={() => {
              if (isExtension()) {
                options.setUserOrigin({ disabled: true });
                props.onClose();
              } else {
                props.showDisableDialog();
              }
            }}
          >
            <svg class={styles.disableIcon} viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13"
              />
            </svg>{" "}
            Disable Locator
          </Button>
        </div>
      </div>
    </div>
  );
}
