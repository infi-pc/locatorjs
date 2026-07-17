import {
  clearUserOriginOptions,
  DEFAULT_LAYER,
  Targets,
} from "@locator/shared";
import { Show, createMemo, createSignal, createEffect } from "solid-js";
import {
  Button,
  IconButton,
  LayeredOptionsEditor,
  LayerTabConfig,
  LocatorBrand,
} from "@locator/ui";
import { css } from "@locator/styled-system/css";
import { Power, RotateCcw, X } from "lucide-solid";
import { isExtension } from "../functions/isExtension";
import { useOptions } from "../functions/optionsStore";
import { AdapterId } from "../consts";
import { LinkPreview } from "./LinkPreview";
import { NvimSetupGuide } from "./NvimSetupGuide";
import {
  getElementInfo,
  getElementInfoAsync,
} from "../adapters/getElementInfo";
import { LinkProps } from "../types/types";

const styles = {
  panel: css({
    bg: "bg.default",
    borderColor: "border",
    borderRadius: "l3",
    borderWidth: "1px",
    bottom: "3",
    boxShadow: "xl",
    color: "fg.default",
    left: "3",
    maxH: "calc(100vh - 24px)",
    maxW: "calc(100vw - 24px)",
    overflowX: "hidden",
    overflowY: "auto",
    overscrollBehavior: "contain",
    pointerEvents: "auto",
    position: "fixed",
    width: "560px",
  }),
  inner: css({ display: "flex", flexDirection: "column" }),
  header: css({
    alignItems: "center",
    bg: "bg.default",
    borderBottomColor: "border",
    borderBottomWidth: "1px",
    display: "flex",
    justifyContent: "space-between",
    px: "4",
    py: "3",
    position: "sticky",
    top: "0",
    zIndex: "sticky",
  }),
  body: css({ display: "flex", flexDirection: "column", gap: "3", p: "4" }),
  editor: css({ mx: "-4" }),
  footer: css({
    display: "flex",
    gap: "2",
    justifyContent: "space-between",
  }),
};

export function Options(props: {
  targets: Targets;
  onClose: () => void;
  showDisableDialog: () => void;
  adapterId?: AdapterId;
  currentElement: HTMLElement | null;
  portalMount: HTMLDivElement;
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
  const isNvimTarget = () => {
    const selected =
      options.effective().targetTemplate ?? options.effective().targetId;
    return (
      selected === "nvim" ||
      (typeof selected === "string" && selected.includes("nvim://"))
    );
  };

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
      class={styles.panel}
      style={{ "--locator-settings-tabs-top": "49px" }}
      onWheel={(e) => e.stopPropagation()}
    >
      <div class={styles.inner}>
        <div class={styles.header}>
          <LocatorBrand />
          <IconButton
            aria-label="Close settings"
            onClick={() => props.onClose()}
          >
            <X size={16} />
          </IconButton>
        </div>

        <div class={styles.body}>
          <LinkPreview linkProps={elLinkProps()} targets={props.targets} />
          <div class={styles.editor}>
            <LayeredOptionsEditor
              tabs={layerTabs()}
              effective={options.effective()}
              provenance={options.provenance()}
              targets={options.allTargets()}
              defaultId="user-origin"
              portalMount={props.portalMount}
            />
          </div>
          <Show when={isNvimTarget()}>
            <NvimSetupGuide />
          </Show>

          <div class={styles.footer}>
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                clearUserOriginOptions();
                props.onClose();
              }}
            >
              <RotateCcw size={14} />
              Reset this origin
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
              <Power size={14} />
              Disable Locator
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
