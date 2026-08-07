import {
  detectSvelte,
  primaryEditorBinding,
  type Binding,
  type BindingAction,
} from "@locator/shared";
import { EnvironmentProvider } from "@ark-ui/solid/environment";
import { batch, createEffect, createSignal, onCleanup, Show } from "solid-js";
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
} from "../functions/bindings";
import { performAction } from "../functions/performAction";
import type { FullElementInfo } from "../adapters/adapterApi";
import { actionLabel } from "@locator/ui";

const styles = {
  sponsorText: css({ color: "fg.muted", fontSize: "xs", mt: "2" }),
  sponsorLink: css({
    color: "blue.11",
    textDecoration: "underline",
    _hover: { color: "blue.12" },
  }),
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
  const [activeBinding, setActiveBinding] = createSignal<Binding | null>(null);
  const [currentElement, setCurrentElement] = createSignal<HTMLElement | null>(
    null
  );

  const [dialog, setDialog] = createSignal<
    ["no-link"] | ["choose-editor", LinkProps] | null
  >(null);

  const [highlightedNode, setHighlightedNode] = createSignal<null | TreeNode>(
    null
  );

  const options = useOptions();
  const adapterId = () =>
    options.effective().adapterId as AdapterId | undefined;
  const targets = () => options.allTargets();
  const bindings = () => effectiveBindings(options.effective());

  createEffect(() => {
    if ((activeBinding() || props.tryAction) && currentElement()) {
      document.body.classList.add("locatorjs-active-pointer");
    } else {
      document.body.classList.remove("locatorjs-active-pointer");
    }
  });

  function keyUpListener(e: KeyboardEvent) {
    setActiveBinding(matchBinding(bindings(), e));
  }

  function keyDownListener(e: KeyboardEvent) {
    if (e.key === "Escape" && props.tryAction) {
      props.setTryAction(null);
      return;
    }
    setActiveBinding(matchBinding(bindings(), e));
  }

  function mouseOverListener(e: MouseEvent) {
    const target = e.target;
    if (target && target instanceof HTMLElement) {
      // Ignore LocatorJS elements
      if (isLocatorsOwnElement(target)) {
        return;
      }

      setActiveBinding(matchBinding(bindings(), e));

      batch(() => {
        setCurrentElement(target);
        // TODO: this is for highlighting elements in the tree, but need to move it to the adapter
        // if (solidMode()[0] === "tree" || solidMode()[0] === "treeFromElement") {
        //   const fiber = findFiberByHtmlElement(target, false);
        //   if (fiber) {
        //     const id = fiberToSimple(fiber, []);
        //     setHighlightedNode(id);
        //   }
        // }
      });

      // const found =
      //   target.closest("[data-locatorjs-id]") ||
      //   searchDevtoolsRenderersForClosestTarget(target);
      // if (found && found instanceof HTMLElement) {
      //   setCurrentElement(found);
      // }
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
    const target = e.target;
    if (target && target instanceof HTMLElement) {
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

    const target = e.target;
    if (target && target instanceof HTMLElement) {
      if (target.shadowRoot) {
        return;
      }

      if (isLocatorsOwnElement(target)) {
        return;
      }

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
      if (!elInfo?.thisElement.link) {
        elInfo = await getElementInfoAsync(target, adapterId());
      }

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
          // eslint-disable-next-line no-console
          console.error(
            "[LocatorJS]: Could not find link: Element info: ",
            elInfo
          );
          setDialog(["no-link"]);
        }
      } else {
        // eslint-disable-next-line no-console
        console.error(
          "[LocatorJS]: Could not find element info. Element: ",
          target
        );
        setDialog(["no-link"]);
      }
    }
  }

  function scrollListener() {
    setCurrentElement(null);
  }

  const roots: (Document | ShadowRoot)[] = [document];
  document.querySelectorAll("*").forEach((node) => {
    if (node.id === "locatorjs-wrapper") {
      return;
    }
    if (node.shadowRoot) {
      roots.push(node.shadowRoot);
    }
  });

  for (const root of roots) {
    root.addEventListener("mouseover", mouseOverListener as EventListener, {
      capture: true,
    });
    root.addEventListener("keydown", keyDownListener as EventListener);
    root.addEventListener("keyup", keyUpListener as EventListener);
    root.addEventListener("click", clickListener as unknown as EventListener, {
      capture: true,
    });
    root.addEventListener("contextmenu", rightClickListener as EventListener, {
      capture: true,
    });

    root.addEventListener("mousedown", mouseDownUpListener as EventListener, {
      capture: true,
    });
    root.addEventListener("mouseup", mouseDownUpListener as EventListener, {
      capture: true,
    });
    root.addEventListener("scroll", scrollListener);
  }

  onCleanup(() => {
    for (const root of roots) {
      root.removeEventListener("keyup", keyUpListener as EventListener);
      root.removeEventListener("keydown", keyDownListener as EventListener);
      root.removeEventListener(
        "mouseover",
        mouseOverListener as EventListener,
        {
          capture: true,
        }
      );
      root.removeEventListener(
        "click",
        clickListener as unknown as EventListener,
        {
          capture: true,
        }
      );
      root.removeEventListener(
        "contextmenu",
        rightClickListener as EventListener,
        {
          capture: true,
        }
      );
      root.removeEventListener(
        "mousedown",
        mouseDownUpListener as EventListener,
        {
          capture: true,
        }
      );
      root.removeEventListener(
        "mouseup",
        mouseDownUpListener as EventListener,
        {
          capture: true,
        }
      );
      root.removeEventListener("scroll", scrollListener);
    }
  });

  function showTreeFromElement(element: HTMLElement) {
    const newState = getTree(element);
    if (newState) {
      setUiMode(["tree", newState]);
    }
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
          adapterId={adapterId()}
          targets={targets()}
          setHighlightedNode={setHighlightedNode}
        />
      ) : null}
      {uiMode()[0] === "context" ? (
        <ContextView
          contextMenuState={uiMode()[1]! as ContextMenuState}
          close={() => setUiMode(["off"])}
          adapterId={adapterId()}
          targets={targets()}
          setHighlightedNode={setHighlightedNode}
        />
      ) : null}
      {(activeBinding() || props.tryAction) && currentElement() ? (
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
      {activeBinding() ? (
        <div class={bannerClass}>
          <BannerHeader openOptions={openOptions} adapter={adapterId()} />
          <div class={styles.sponsorText}>
            Support me on{" "}
            <a
              class={styles.sponsorLink}
              href="https://github.com/sponsors/infi-pc"
              target="_blank"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(`https://github.com/sponsors/infi-pc`);
              }}
            >
              GitHub sponsors
            </a>
          </div>
        </div>
      ) : null}
      {highlightedNode() ? (
        <SimpleNodeOutline node={highlightedNode()!} />
      ) : null}
      {!isExtension() && options.effective().showIntro !== false ? (
        <IntroInfo
          openOptions={openOptions}
          hide={!!activeBinding() || uiMode()[0] !== "off" || !!dialog()}
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
          {dialog()![0] === "choose-editor" && (
            <WelcomeScreen
              targets={targets()}
              originalLinkProps={dialog()![1]!}
              portalMount={props.portalMount}
              onTry={() => {
                setDialog(null);
                const binding = primaryEditorBinding(bindings());
                if (binding) props.setTryAction(binding.action);
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
  render(
    () => (
      <EnvironmentProvider value={() => solidLayer.getRootNode() as ShadowRoot}>
        <OptionsProvider>
          <RuntimeWrapper portalMount={solidLayer} />
        </OptionsProvider>
      </EnvironmentProvider>
    ),
    solidLayer
  );
}
