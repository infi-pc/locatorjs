import {
  DEFAULT_LAYER,
  resolveBindingTarget,
  resolveEditorTarget,
  type BindingAction,
  type ResolvedTarget,
  type Targets,
} from "@locator/shared";
import { Show, createSignal } from "solid-js";
import {
  ActionSettings,
  type ActionSettingsSaveStatus,
  Button,
  IconButton,
  LocatorBrand,
  PromoFooter,
} from "@locator/ui";
import { css } from "@locator/styled-system/css";
import { Power, RotateCcw, X } from "lucide-solid";
import { isExtension } from "../functions/isExtension";
import { useOptions } from "../functions/optionsStore";
import { NvimSetupGuide } from "./NvimSetupGuide";

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
    overflow: "clip",
    pointerEvents: "auto",
    position: "fixed",
    width: "560px",
  }),
  inner: css({
    display: "flex",
    flexDirection: "column",
    maxH: "calc(100vh - 24px)",
    overflowY: "auto",
    overscrollBehavior: "contain",
  }),
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
  footer: css({
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "2",
    justifyContent: "space-between",
    pt: "3",
  }),
  footerStatus: css({ color: "fg.muted", fontSize: "xs" }),
  footerActions: css({
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "1",
  }),
  confirm: css({ color: "fg.muted", fontSize: "xs" }),
};

export function Options(props: {
  targets: Targets;
  onClose: () => void;
  showDisableDialog: () => void;
  portalMount: HTMLDivElement;
  onTryAction: (action: BindingAction) => void;
}) {
  const options = useOptions();
  const [saveStatus, setSaveStatus] =
    createSignal<ActionSettingsSaveStatus>("idle");
  const [confirmReset, setConfirmReset] = createSignal(false);
  const [inspectorMount, setInspectorMount] = createSignal<HTMLDivElement>();
  /**
   * True when anything would open Neovim, so the one-time `nvim://` handler
   * guide is shown. Resolved rather than read off the raw action: picking
   * Neovim in the editor picker records it on the global `editor` setting and
   * deliberately strips `targetId` off the binding, so an action's own fields
   * say nothing about where it opens.
   */
  const isNvimTarget = () => {
    const targets = options.allTargets();
    const editor = options.effective().editor;
    const opensNvim = (resolved: ResolvedTarget) =>
      (resolved.kind === "targetId" && resolved.id === "nvim") ||
      resolved.url.includes("nvim://");

    if (opensNvim(resolveEditorTarget(editor, targets))) return true;

    return (options.effective().bindings ?? []).some(
      (binding) =>
        binding.action.kind === "open-editor" &&
        opensNvim(resolveBindingTarget(binding.action, targets, editor))
    );
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
      ref={setInspectorMount}
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
            portalMount={props.portalMount}
            inspectorMount={inspectorMount()}
            onTryAction={(action) => props.onTryAction?.(action)}
            onSaveStatusChange={setSaveStatus}
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
            <span class={styles.footerStatus} role="status">
              {saveStatus() === "saving"
                ? "Saving…"
                : saveStatus() === "saved"
                ? "Saved"
                : saveStatus() === "error"
                ? "Could not save"
                : "Changes save automatically"}
            </span>
            <div class={styles.footerActions}>
              <Show when={confirmReset()}>
                <span class={styles.confirm}>
                  Reset settings for this site?
                </span>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setConfirmReset(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="xs"
                  variant="danger-ghost"
                  onClick={async () => {
                    const result = await options.clearUserOrigin();
                    setSaveStatus(result.ok ? "saved" : "error");
                    if (result.ok) setConfirmReset(false);
                  }}
                >
                  Reset
                </Button>
              </Show>
              <Show when={!confirmReset()}>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setConfirmReset(true)}
                >
                  <RotateCcw size={14} /> Reset
                </Button>
              </Show>
              <Button
                size="xs"
                variant="danger-ghost"
                onClick={async () => {
                  if (isExtension()) {
                    setSaveStatus("saving");
                    const result = await options.setUserOrigin({
                      disabled: true,
                    });
                    setSaveStatus(result.ok ? "saved" : "error");
                    if (result.ok) props.onClose();
                  } else {
                    props.showDisableDialog();
                  }
                }}
              >
                <Power size={14} /> Disable
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
