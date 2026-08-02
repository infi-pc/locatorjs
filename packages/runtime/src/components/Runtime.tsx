import {
  detectSvelte,
  primaryEditorBinding,
  resolveBindingTarget,
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

function Runtime(props: { portalMount: HTMLDivElement }) {
  const [uiMode, setUiMode] = createSignal<UiMode>(["off"]);
  const [activeBinding, setActiveBinding] = createSignal<Binding | null>(null);
  const [tryMode, setTryMode] = createSignal(false);
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
  const defaultEditorId = () => {
    const action = primaryEditorBinding(bindings())?.action;
    if (!action || action.kind !== "open-editor") {
      return targets().vscode
        ? "vscode"
        : Object.keys(targets())[0] ?? "default";
    }
    const target = resolveBindingTarget(action, targets());
    return target.kind === "template" ? "custom" : target.id;
  };

  createEffect(() => {
    if ((activeBinding() || tryMode()) && currentElement()) {
      document.body.classList.add("locatorjs-active-pointer");
    } else {
      document.body.classList.remove("locatorjs-active-pointer");
    }
  });

  function keyUpListener(e: KeyboardEvent) {
    setActiveBinding(matchBinding(bindings(), e));
  }

  function keyDownListener(e: KeyboardEvent) {
    if (e.key === "Escape" && tryMode()) {
      setTryMode(false);
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
    if (matchBinding(bindings(), e) || tryMode()) {
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
      matchBinding(bindings(), e) ??
      (tryMode() ? primaryEditorBinding(bindings()) ?? null : null);
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
          !tryMode()
        ) {
          setDialog(["choose-editor", elInfo.thisElement.link!]);
        } else {
          if (binding.action.kind === "open-editor") trackClickStats();
          await runAction(binding.action, elInfo);
          if (tryMode()) setTryMode(false);
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
            !tryMode()
          ) {
            setDialog(["choose-editor", linkProps!]);
          } else {
            if (binding.action.kind === "open-editor") trackClickStats();
            await runAction(binding.action, elInfo);
            if (tryMode()) setTryMode(false);
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
      {(activeBinding() || tryMode()) && currentElement() ? (
        <MaybeOutline
          currentElement={currentElement()!}
          adapterId={adapterId()}
          targets={targets()}
          defaultEditorId={defaultEditorId()}
          showTreeFromElement={showTreeFromElement}
          showParentsPath={showContextMenu}
          bindings={iconBindings(bindings())}
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
      {uiMode()[0] === "options" && !tryMode() ? (
        <Options
          adapterId={adapterId()}
          targets={targets()}
          portalMount={props.portalMount}
          onClose={() => {
            setUiMode(["off"]);
          }}
          showDisableDialog={() => {
            setUiMode(["disable-confirmation"]);
          }}
          currentElement={currentElement()}
          onTry={() => setTryMode(true)}
        />
      ) : null}
      {tryMode() ? (
        <div class={styles.tryPill}>
          Trying Locator — hover an element and click. Esc to return.
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
                setTryMode(true);
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

  const isDisabled = () => options.effective().disabled || false;

  createEffect(() => {
    if (isDisabled() && isExtension()) {
      document.head.dataset.locatorDisabled = "disabled";
    } else {
      delete document.head.dataset.locatorDisabled;
    }
  });

  return (
    <Show when={!isDisabled()}>
      <Runtime portalMount={props.portalMount} />
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
