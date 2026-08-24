import {
  detectSvelte,
  primaryEditorBinding,
  actionLabel,
  type BindingAction,
} from "@locator/shared";
import { EnvironmentProvider } from "@ark-ui/solid/environment";
import { createEffect, createSignal, onCleanup, Show } from "solid-js";
import { render } from "solid-js/web";
import { AdapterId } from "../consts";
import { trackClickStats } from "../functions/trackClickStats";
import { ContextMenuState, LinkProps } from "../types/types";
import { MaybeOutline } from "./MaybeOutline";
import { SimpleNodeOutline } from "./SimpleNodeOutline";

import { IntroInfo } from "./IntroInfo";
import { Options } from "./Options";
import { bannerClass } from "../functions/bannerClasses";
import BannerHeader from "./BannerHeader";
import { isExtension } from "../functions/isExtension";
import { NoLinkDialog } from "./NoLinkDialog";
import { WelcomeScreen } from "./WelcomeScreen";
import { isLocatorsOwnElement } from "../functions/isLocatorsOwnElement";
import {
  getElementInfo,
  getElementInfoAsync,
} from "../adapters/getElementInfo";
import { getTree } from "../adapters/getTree";
import { TreeNode } from "../types/TreeNode";
import { TreeState } from "../adapters/adapterApi";
import { TreeView } from "./TreeView";
import { OptionsProvider, useOptions } from "../functions/optionsStore";
import { DisableConfirmation } from "./DisableConfirmation";
import { ContextView } from "./ContextView";
import { css } from "@locator/styled-system/css";
import {
  effectiveBindings,
  iconBindings,
  matchBinding,
  matchesActivation,
} from "../functions/bindings";
import { performAction } from "../functions/performAction";
import { goToLinkPropsOrSetup } from "../functions/goTo";
import { idsOnPathToRoot } from "../functions/treeViewModel";
import type { FullElementInfo } from "../adapters/adapterApi";
import { PortalMountProvider } from "@locator/ui";
import { resolveEventTarget } from "../functions/resolveEventTarget";
import {
  observeShadowRoots,
  setPointerCursorInShadowRoots,
} from "../functions/shadowRoots";
import {
  broadcastModifiers,
  listenToFrameModifiers,
  modifiersFromEvent,
} from "../functions/crossFrameModifiers";
import generatedStyles from "../_generated_styles";

const styles = {
  dialogBackdrop: css({
    alignItems: "center",
    bg: "black/70",
    display: "flex",
    height: "100vh",
    justifyContent: "center",
    left: "0",
    pointerEvents: "auto",
    position: "fixed",
    top: "0",
    width: "100vw",
    // Below `popover`, so the dropdowns the dialog itself opens land above it.
    zIndex: "modal",
  }),
  tryPill: css({
    bg: "bg.default",
    borderColor: "border",
    borderRadius: "full",
    borderWidth: "1px",
    bottom: "3",
    boxShadow: "lg",
    color: "fg.default",
    fontSize: "sm",
    left: "50%",
    px: "4",
    py: "2",
    pointerEvents: "auto",
    position: "fixed",
    transform: "translateX(-50%)",
  }),
};

type UiMode =
  | ["off"]
  | ["options"]
  | ["tree", TreeState]
  | ["context", ContextMenuState]
  | ["disable-confirmation"];

function Runtime(props: {
  portalMount: HTMLDivElement;
  tryAction: BindingAction | null;
  setTryAction: (action: BindingAction | null) => void;
}) {
  const [uiMode, setUiMode] = createSignal<UiMode>(["off"]);
  // Holding an activation modifier reveals the outline and its toolbar. It is
  // deliberately separate from binding matching: a config with only toolbar
  // actions still needs a way to bring the toolbar up.
  const [activationHeld, setActivationHeld] = createSignal(false);
  const [currentElement, setCurrentElement] = createSignal<HTMLElement | null>(
    null
  );
  const [resolutionPending, setResolutionPending] = createSignal(false);
  let resolutionSequence = 0;
  let activeResolution: { id: number; controller: AbortController } | undefined;

  const cancelResolution = () => {
    activeResolution?.controller.abort();
    activeResolution = undefined;
    setResolutionPending(false);
  };
  let previousTryAction: BindingAction | null | undefined;
  createEffect(() => {
    const nextTryAction = props.tryAction;
    if (nextTryAction !== previousTryAction) {
      previousTryAction = nextTryAction;
      cancelResolution();
    }
  });

  const [dialog, setDialog] = createSignal<
    | ["no-link"]
    | ["choose-editor", LinkProps]
    // Same wizard, but opened because we could not tell where to open a link,
    // so it starts on the editor question instead of resuming onboarding.
    | ["setup-editor", LinkProps]
    | null
  >(null);

  const [highlightedNode, setHighlightedNode] = createSignal<null | TreeNode>(
    null
  );

  const options = useOptions();
  const adapterId = () =>
    options.effective().adapterId as AdapterId | undefined;
  const targets = () => options.allTargets();
  const bindings = () => effectiveBindings(options.effective());

  const outlineVisible = () =>
    (activationHeld() || !!props.tryAction) && !!currentElement();

  createEffect(() => {
    const active = outlineVisible();
    if (active) {
      document.body.classList.add("locatorjs-active-pointer");
    } else {
      document.body.classList.remove("locatorjs-active-pointer");
    }
    setPointerCursorInShadowRoots(active);
  });

  function keyUpListener(e: KeyboardEvent) {
    setActivationHeld(matchesActivation(bindings(), e));
    broadcastModifiers(modifiersFromEvent(e));
  }

  function keyDownListener(e: KeyboardEvent) {
    if (e.key === "Escape") {
      cancelResolution();
      if (props.tryAction) {
        props.setTryAction(null);
        return;
      }
    }
    setActivationHeld(matchesActivation(bindings(), e));
    broadcastModifiers(modifiersFromEvent(e));
  }

  // Keyboard events only reach the focused document, so a frame under the mouse
  // has to be told about modifiers held in a sibling or parent frame.
  const stopListeningToFrameModifiers = listenToFrameModifiers((modifiers) => {
    setActivationHeld(matchesActivation(bindings(), modifiers));
  });
  onCleanup(stopListeningToFrameModifiers);

  function mouseOverListener(e: MouseEvent) {
    const target = resolveEventTarget(e);
    if (target) {
      // Ignore LocatorJS elements
      if (isLocatorsOwnElement(target)) {
        return;
      }
      setActivationHeld(matchesActivation(bindings(), e));

      setCurrentElement(target);
    }
  }

  function mouseDownUpListener(e: MouseEvent) {
    if (matchBinding(bindings(), e) || props.tryAction) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function showContextMenu(target: HTMLElement, x: number, y: number) {
    setUiMode([
      "context",
      {
        target,
        x,
        y,
      },
    ]);
  }

  function onboardingDismissed() {
    return (
      options.uiState().onboarding?.dismissed ??
      options.uiState().welcomeScreenDismissed ??
      false
    );
  }

  function rightClickListener(e: MouseEvent) {
    if (!matchBinding(bindings(), e, { ignoreCtrl: true })) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const x = e.clientX;
    const y = e.clientY;

    // show context menu
    const target = resolveEventTarget(e);
    if (target) {
      showContextMenu(target, x, y);
    }
  }

  async function clickListener(e: MouseEvent) {
    const binding =
      (props.tryAction
        ? {
            trigger: { kind: "hover-toolbar" } as const,
            action: props.tryAction,
          }
        : null) ?? matchBinding(bindings(), e);
    if (!binding) return;

    const target = resolveEventTarget(e);
    if (target) {
      if (isLocatorsOwnElement(target)) {
        return;
      }

      // A click is the unit of intent. Even a synchronously resolvable second
      // click supersedes an older async operation.
      cancelResolution();

      // Try sync resolution first
      let elInfo = getElementInfo(target, adapterId());

      if (
        elInfo &&
        (elInfo.thisElement.link || !actionNeedsSourceLink(binding.action))
      ) {
        // Sync found a link — prevent default and navigate
        e.preventDefault();
        e.stopPropagation();
        if (
          binding.action.kind === "open-editor" &&
          (!isExtension() || detectSvelte()) &&
          !onboardingDismissed() &&
          !props.tryAction
        ) {
          setDialog(["choose-editor", elInfo.thisElement.link!]);
        } else {
          if (binding.action.kind === "open-editor") trackClickStats();
          const succeeded = await runAction(binding.action, elInfo);
          if (props.tryAction && succeeded) props.setTryAction(null);
        }
        return;
      }

      // Sync failed to find link — prevent default before async to avoid
      // page navigation during the await
      e.preventDefault();
      e.stopPropagation();

      // Try async resolution (source-map, Turbopack, etc.)
      const tryActionAtClick = props.tryAction;
      const operation = {
        id: ++resolutionSequence,
        controller: new AbortController(),
      };
      activeResolution = operation;
      setResolutionPending(true);
      const context = {
        signal: operation.controller.signal,
        deadline: Date.now() + 4_000,
      };
      const finishResolution = () => {
        if (activeResolution?.id !== operation.id) return;
        activeResolution = undefined;
        setResolutionPending(false);
      };
      try {
        if (!elInfo?.thisElement.link) {
          elInfo = await getElementInfoAsync(target, adapterId(), context);
        }

        // Resolution can take a while, and Esc or a mode change during it means
        // the user no longer wants this action to fire.
        if (
          activeResolution?.id !== operation.id ||
          operation.controller.signal.aborted ||
          props.tryAction !== tryActionAtClick
        ) {
          return;
        }
        finishResolution();

        if (elInfo) {
          const linkProps = elInfo.thisElement.link;
          if (linkProps || !actionNeedsSourceLink(binding.action)) {
            if (
              binding.action.kind === "open-editor" &&
              (!isExtension() || detectSvelte()) &&
              !onboardingDismissed() &&
              !props.tryAction
            ) {
              setDialog(["choose-editor", linkProps!]);
            } else {
              if (binding.action.kind === "open-editor") trackClickStats();
              const succeeded = await runAction(binding.action, elInfo);
              if (props.tryAction && succeeded) props.setTryAction(null);
            }
          } else {
            // eslint-disable-next-line no-console -- a failed user action needs a visible developer diagnostic.
            console.error(
              "[LocatorJS]: Could not find link: Element info: ",
              elInfo
            );
            setDialog(["no-link"]);
          }
        } else {
          // eslint-disable-next-line no-console -- a failed user action needs a visible developer diagnostic.
          console.error(
            "[LocatorJS]: Could not find element info. Element: ",
            target
          );
          setDialog(["no-link"]);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          throw error;
        }
      } finally {
        finishResolution();
      }
    }
  }

  function scrollListener() {
    setCurrentElement(null);
  }

  /** The pointer left this document, e.g. moved into an iframe. */
  function mouseOutListener(e: MouseEvent) {
    if (!e.relatedTarget) {
      setCurrentElement(null);
    }
  }

  // Mouse and keyboard events from open shadow roots are composed, so they all
  // reach the document; `resolveEventTarget` recovers the real target from the
  // composed path. Only `scroll` does not compose, so scroll containers living
  // inside a shadow root need their own listener.
  document.addEventListener("mouseover", mouseOverListener as EventListener, {
    capture: true,
  });
  document.addEventListener("mouseout", mouseOutListener as EventListener, {
    capture: true,
  });
  document.addEventListener("keydown", keyDownListener as EventListener);
  document.addEventListener("keyup", keyUpListener as EventListener);
  document.addEventListener(
    "click",
    clickListener as unknown as EventListener,
    { capture: true }
  );
  document.addEventListener(
    "contextmenu",
    rightClickListener as EventListener,
    {
      capture: true,
    }
  );
  document.addEventListener("mousedown", mouseDownUpListener as EventListener, {
    capture: true,
  });
  document.addEventListener("mouseup", mouseDownUpListener as EventListener, {
    capture: true,
  });
  document.addEventListener("scroll", scrollListener, { capture: true });

  const scrollRoots = new Set<ShadowRoot>();
  const stopObservingShadowRoots = observeShadowRoots((root) => {
    if (scrollRoots.has(root)) return;
    scrollRoots.add(root);
    root.addEventListener("scroll", scrollListener, { capture: true });
  });

  onCleanup(() => {
    cancelResolution();
    document.removeEventListener("keyup", keyUpListener as EventListener);
    document.removeEventListener("keydown", keyDownListener as EventListener);
    document.removeEventListener(
      "mouseover",
      mouseOverListener as EventListener,
      { capture: true }
    );
    document.removeEventListener(
      "mouseout",
      mouseOutListener as EventListener,
      { capture: true }
    );
    document.removeEventListener(
      "click",
      clickListener as unknown as EventListener,
      { capture: true }
    );
    document.removeEventListener(
      "contextmenu",
      rightClickListener as EventListener,
      { capture: true }
    );
    document.removeEventListener(
      "mousedown",
      mouseDownUpListener as EventListener,
      { capture: true }
    );
    document.removeEventListener(
      "mouseup",
      mouseDownUpListener as EventListener,
      { capture: true }
    );
    document.removeEventListener("scroll", scrollListener, { capture: true });

    stopObservingShadowRoots();
    for (const root of scrollRoots) {
      root.removeEventListener("scroll", scrollListener, { capture: true });
    }
    scrollRoots.clear();
  });

  function showTreeFromElement(element: HTMLElement) {
    const newState = getTree(element, adapterId());
    if (!newState) return;
    // The panel opens on the element the user pointed at, so every row between
    // it and the root has to start out expanded or it would not be visible.
    setUiMode([
      "tree",
      {
        ...newState,
        expandedIds: new Set([
          ...newState.expandedIds,
          ...idsOnPathToRoot(newState),
        ]),
      },
    ]);
  }

  function requestEditorSetup(link: LinkProps) {
    setDialog(["setup-editor", link]);
  }

  /**
   * Opens a source link from the tree or the parents menu. When we would be
   * guessing the destination, the editor picker is shown instead of navigating
   * into the void.
   */
  function openLink(link: LinkProps): void {
    if (goToLinkPropsOrSetup(link, targets(), options)) return;
    requestEditorSetup(link);
  }

  function runAction(
    action: BindingAction,
    element: FullElementInfo,
    position?: { x: number; y: number }
  ) {
    return performAction(action, {
      element,
      targets: targets(),
      options,
      showTree: showTreeFromElement,
      showParents: showContextMenu,
      parentsPosition: position,
      requestEditorSetup,
    });
  }

  function openOptions() {
    setUiMode(["options"]);
  }
  return (
    <>
      {uiMode()[0] === "tree" ? (
        <TreeView
          treeState={uiMode()[1]! as TreeState}
          close={() => setUiMode(["off"])}
          setTreeState={(newState) => setUiMode(["tree", newState])}
          targets={targets()}
          setHighlightedNode={setHighlightedNode}
          openLink={openLink}
        />
      ) : null}
      {uiMode()[0] === "context" ? (
        <ContextView
          contextMenuState={uiMode()[1]! as ContextMenuState}
          close={() => setUiMode(["off"])}
          adapterId={adapterId()}
          targets={targets()}
          openLink={openLink}
        />
      ) : null}
      {outlineVisible() ? (
        <MaybeOutline
          currentElement={currentElement()!}
          adapterId={adapterId()}
          targets={targets()}
          showTreeFromElement={showTreeFromElement}
          bindings={
            props.tryAction
              ? [
                  {
                    trigger: { kind: "hover-toolbar" },
                    action: props.tryAction,
                  },
                ]
              : iconBindings(bindings())
          }
          performAction={runAction}
        />
      ) : null}
      {activationHeld() ? (
        <div class={bannerClass}>
          <BannerHeader openOptions={openOptions} adapter={adapterId()} />
        </div>
      ) : null}
      {highlightedNode() ? (
        <SimpleNodeOutline node={highlightedNode()!} />
      ) : null}
      {!isExtension() && options.effective().showIntro !== false ? (
        <IntroInfo
          openOptions={openOptions}
          hide={activationHeld() || uiMode()[0] !== "off" || !!dialog()}
          adapter={adapterId()}
        />
      ) : null}
      {uiMode()[0] === "options" && !props.tryAction ? (
        <Options
          targets={targets()}
          portalMount={props.portalMount}
          onClose={() => {
            setUiMode(["off"]);
          }}
          showDisableDialog={() => {
            setUiMode(["disable-confirmation"]);
          }}
          onTryAction={(action) => {
            props.setTryAction(action);
            setUiMode(["off"]);
          }}
        />
      ) : null}
      {props.tryAction ? (
        <div class={styles.tryPill}>
          Trying “{actionLabel(props.tryAction, targets())}” — click a
          component. Esc to cancel.
        </div>
      ) : null}
      {resolutionPending() ? (
        <div class={styles.tryPill} role="status">
          Finding source… Esc to cancel.
        </div>
      ) : null}
      {uiMode()[0] === "disable-confirmation" ? (
        <DisableConfirmation
          onClose={() => {
            setUiMode(["off"]);
          }}
        />
      ) : null}
      {dialog() && (
        <div
          class={styles.dialogBackdrop}
          onClick={(e) => {
            if (e.currentTarget === e.target) {
              setDialog(null);
            }
          }}
        >
          {dialog()![0] === "no-link" && <NoLinkDialog />}
          {(dialog()![0] === "choose-editor" ||
            dialog()![0] === "setup-editor") && (
            <WelcomeScreen
              targets={targets()}
              originalLinkProps={dialog()![1]!}
              portalMount={props.portalMount}
              initialStep={
                dialog()![0] === "setup-editor" ? "editor" : undefined
              }
              onTry={() => {
                setDialog(null);
                // Without an editor binding there is still one thing to try:
                // opening the editor that was just picked.
                props.setTryAction(
                  primaryEditorBinding(bindings())?.action ?? {
                    kind: "open-editor",
                  }
                );
              }}
              onClose={() => {
                setDialog(null);
              }}
            />
          )}
        </div>
      )}
    </>
  );
}

function actionNeedsSourceLink(action: BindingAction) {
  return action.kind === "open-editor" || action.kind === "copy-path";
}

function RuntimeWrapper(props: { portalMount: HTMLDivElement }) {
  const options = useOptions();
  const [tryAction, setTryAction] = createSignal<BindingAction | null>(null);

  const isDisabled = () => options.effective().disabled || false;

  createEffect(() => {
    if (isDisabled() && isExtension()) {
      document.head.dataset.locatorDisabled = "disabled";
    } else {
      delete document.head.dataset.locatorDisabled;
    }
  });

  const onTryAction = (event: Event) => {
    const action = (event as CustomEvent<BindingAction>).detail;
    setTryAction(action);
  };
  window.addEventListener("locatorjs:try-action", onTryAction);
  onCleanup(() =>
    window.removeEventListener("locatorjs:try-action", onTryAction)
  );

  return (
    <Show when={!isDisabled()}>
      <Runtime
        portalMount={props.portalMount}
        tryAction={tryAction()}
        setTryAction={setTryAction}
      />
    </Show>
  );
}

export function initRender(solidLayer: HTMLDivElement) {
  const root = solidLayer.getRootNode();
  if (
    root instanceof ShadowRoot &&
    !root.getElementById("locatorjs-feature-style")
  ) {
    const featureStyle = document.createElement("style");
    featureStyle.id = "locatorjs-feature-style";
    featureStyle.textContent = generatedStyles;
    root.prepend(featureStyle);
  }
  render(
    () => (
      <EnvironmentProvider value={() => solidLayer.getRootNode() as ShadowRoot}>
        <PortalMountProvider mount={solidLayer}>
          <OptionsProvider>
            <RuntimeWrapper portalMount={solidLayer} />
          </OptionsProvider>
        </PortalMountProvider>
      </EnvironmentProvider>
    ),
    solidLayer
  );
}
