import { DEFAULT_LAYER, type Targets } from "@locator/shared";
import { Show, createMemo, createSignal, createEffect } from "solid-js";
import {
  ActionSettings,
  Button,
  IconButton,
  LocatorBrand,
  PromoFooter,
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
  headerLeft: css({ alignItems: "center", display: "flex", gap: "2" }),
  body: css({ display: "flex", flexDirection: "column", gap: "3", p: "4" }),
  footer: css({
    display: "flex",
    gap: "2",
    justifyContent: "space-between",
    pb: "10",
  }),
};

export function Options(props: {
  targets: Targets;
  onClose: () => void;
  showDisableDialog: () => void;
  adapterId?: AdapterId;
  currentElement: HTMLElement | null;
  portalMount: HTMLDivElement;
  onTry: () => void;
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
    return (options.effective().bindings ?? []).some((binding) => {
      const action = binding.action;
      return (
        action.kind === "open-editor" &&
        (action.targetId === "nvim" ||
          action.targetTemplate?.includes("nvim://"))
      );
    });
  };

  const promos = () => [
    ...(!isExtension()
      ? [
          {
            text: "Keep these settings on every site.",
            href: "https://www.locatorjs.com/install",
            linkLabel: "Install the browser extension",
          },
        ]
      : []),
    ...(!options.layers().team ||
    Object.keys(options.layers().team ?? {}).length === 0
      ? [
          {
            text: "Share Locator defaults with your team.",
            href: "https://www.locatorjs.com/docs",
            linkLabel: "Set up Locator via setup()",
          },
        ]
      : []),
  ];

  return (
    <div
      class={styles.panel}
      style={{ "--locator-settings-tabs-top": "49px" }}
      onWheel={(e) => e.stopPropagation()}
    >
      <div class={styles.inner}>
        <div class={styles.header}>
          <div class={styles.headerLeft}>
            <LocatorBrand />
          </div>
          <IconButton
            aria-label="Close settings"
            onClick={() => props.onClose()}
          >
            <X size={16} />
          </IconButton>
        </div>

        <div class={styles.body}>
          <ActionSettings
            layers={{
              ...options.layers(),
              default: options.layers().default ?? DEFAULT_LAYER,
            }}
            scopes={[
              {
                layer: "user-origin",
                label: "This origin",
                write: options.setUserOrigin,
                note: "Changes are stored for this site in your browser profile.",
              },
            ]}
            defaultScope="user-origin"
            targets={options.allTargets()}
            surface="panel"
            portalMount={props.portalMount}
            renderPreview={(action) => (
              <LinkPreview
                linkProps={elLinkProps()}
                targets={props.targets}
                action={action}
              />
            )}
            advancedExtras={
              <>
                <Show when={isNvimTarget()}>
                  <NvimSetupGuide />
                </Show>
                <Show when={promos().length > 0}>
                  <PromoFooter promos={promos()} />
                </Show>
              </>
            }
          />

          <div class={styles.footer}>
            <Button size="xs" variant="primary" onClick={() => props.onTry()}>
              Try Locator
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                options.clearUserOrigin();
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
