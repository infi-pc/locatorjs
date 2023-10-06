import { detectSvelte, Targets } from "@locator/shared";
import { batch, createEffect, createSignal, onCleanup, Show } from "solid-js";
import { render } from "solid-js/web";
import { AdapterId } from "../consts";
import { isCombinationModifiersPressed } from "../functions/isCombinationModifiersPressed";
import { trackClickStats } from "../functions/trackClickStats";
import {
  ContextMenuState,
  LinkProps,
  Targets as SetupTargets,
} from "../types/types";
import { MaybeOutline } from "./MaybeOutline";
import { SimpleNodeOutline } from "./SimpleNodeOutline";

import { IntroInfo } from "./IntroInfo";
import { Options } from "./Options";
import { bannerClasses } from "../functions/bannerClasses";
import BannerHeader from "./BannerHeader";
import { isExtension } from "../functions/isExtension";
import { NoLinkDialog } from "./NoLinkDialog";
import { WelcomeScreen } from "./WelcomeScreen";
import { isLocatorsOwnElement } from "../functions/isLocatorsOwnElement";
import { goToLinkProps } from "../functions/goTo";
import { getElementInfo } from "../adapters/getElementInfo";
import { getTree } from "../adapters/getTree";
import { TreeNode } from "../types/TreeNode";
import { TreeState } from "../adapters/adapterApi";
import { TreeView } from "./TreeView";
import { OptionsProvider, useOptions } from "../functions/optionsStore";
import { DisableConfirmation } from "./DisableConfirmation";
import { ContextView } from "./ContextView";
import { buildLink } from "../functions/buildLink";

type UiMode =
  | ["off"]
  | ["options"]
  | ["tree", TreeState]
  | ["context", ContextMenuState]
  | ["disable-confirmation"];

type RuntimeProps = {
  adapterId?: AdapterId;
  targets: Targets;
};

function Runtime(props: RuntimeProps) {
  const [uiMode, setUiMode] = createSignal<UiMode>(["off"]);
  const [holdingModKey, setHoldingModKey] = createSignal<boolean>(false);
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

  createEffect(() => {
    if (holdingModKey() && currentElement()) {
      document.body.classList.add("locatorjs-active-pointer");
    } else {
      document.body.classList.remove("locatorjs-active-pointer");
    }
  });

  function keyUpListener(e: KeyboardEvent) {
    // if (e.code === "KeyO" && isCombinationModifiersPressed(e)) {
    //   if (uiMode()[0] === "tree") {
    //     setUiMode(["off"]);
    //   } else {
    //     setUiMode(["tree"]);
    //   }
    // }

    setHoldingModKey(isCombinationModifiersPressed(e));
  }

  function keyDownListener(e: KeyboardEvent) {
    setHoldingModKey(isCombinationModifiersPressed(e, true));
  }

  function mouseOverListener(e: MouseEvent) {
    const target = e.target;
    if (target && target instanceof HTMLElement) {
      // Ignore LocatorJS elements
      if (isLocatorsOwnElement(target)) {
        return;
      }

      setHoldingModKey(isCombinationModifiersPressed(e, true));

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
    if (isCombinationModifiersPressed(e)) {
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

  function copyToClipboard(target: HTMLElement) {
    const elInfo = getElementInfo(target, props.adapterId);

    if (elInfo) {
      const linkProps = elInfo.thisElement.link;
      if (linkProps) {
        navigator.clipboard.writeText(linkProps.filePath);
      }
    }
  }

  function rightClickListener(e: MouseEvent) {
    if (!isCombinationModifiersPressed(e, true)) {
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

  function clickListener(e: MouseEvent) {
    if (!isCombinationModifiersPressed(e) && uiMode()[0] !== "options") {
      return;
    }

    const target = e.target;
    if (target && target instanceof HTMLElement) {
      if (target.shadowRoot) {
        return;
      }

      if (isLocatorsOwnElement(target)) {
        return;
      }

      const elInfo = getElementInfo(target, props.adapterId);

      if (elInfo) {
        const linkProps = elInfo.thisElement.link;
        if (linkProps) {
          e.preventDefault();
          e.stopPropagation();
          trackClickStats();

          if (
            (!isExtension() || detectSvelte()) &&
            !options.getOptions().welcomeScreenDismissed
          ) {
            setDialog(["choose-editor", linkProps]);
          } else {
            // const link = buidLink(linkProps, props.targets);
            goToLinkProps(linkProps, props.targets, options);
          }
        } else {
          console.error(
            "[LocatorJS]: Could not find link: Element info: ",
            elInfo
          );
          setDialog(["no-link"]);
        }
      } else {
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
    root.addEventListener("click", clickListener as EventListener, {
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
      root.removeEventListener("click", clickListener as EventListener, {
        capture: true,
      });
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
          adapterId={props.adapterId}
          targets={props.targets}
          setHighlightedNode={setHighlightedNode}
        />
      ) : null}
      {uiMode()[0] === "context" ? (
        <ContextView
          contextMenuState={uiMode()[1]! as ContextMenuState}
          close={() => setUiMode(["off"])}
          adapterId={props.adapterId}
          targets={props.targets}
          setHighlightedNode={setHighlightedNode}
        />
      ) : null}
      {(holdingModKey() || uiMode()[0] === "options") && currentElement() ? (
        <MaybeOutline
          currentElement={currentElement()!}
          adapterId={props.adapterId}
          targets={props.targets}
          showTreeFromElement={showTreeFromElement}
          showParentsPath={showContextMenu}
          copyToClipboard={copyToClipboard}
        />
      ) : null}
      {holdingModKey() ? (
        <div class={bannerClasses()}>
          <BannerHeader openOptions={openOptions} adapter={props.adapterId} />
          <div class="mt-2 text-xs text-gray-600">
            Support me on{" "}
            <a
              class="underline hover:text-sky-900 text-sky-700"
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
      {!isExtension() && options.getOptions().showIntro !== false ? (
        <IntroInfo
          openOptions={openOptions}
          hide={!!holdingModKey() || uiMode()[0] !== "off"}
          adapter={props.adapterId}
        />
      ) : null}
      {uiMode()[0] === "options" ? (
        <Options
          adapterId={props.adapterId}
          targets={props.targets}
          onClose={() => {
            setUiMode(["off"]);
          }}
          showDisableDialog={() => {
            setUiMode(["disable-confirmation"]);
          }}
          currentElement={currentElement()}
        />
      ) : null}
      {uiMode()[0] === "disable-confirmation" ? (
        <DisableConfirmation
          onClose={() => {
            setUiMode(["off"]);
          }}
        />
      ) : null}
      {/* {holdingModKey() &&
      currentElement() &&
      getElementInfo(currentElement()!) ? (
        <Outline element={getElementInfo(currentElement()!)!} />
      ) : null} */}
      {dialog() && (
        <div
          class="fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-black/70 pointer-events-auto"
          onClick={(e) => {
            if (e.currentTarget === e.target) {
              setDialog(null);
            }
          }}
        >
          {dialog()![0] === "no-link" && <NoLinkDialog />}
          {dialog()![0] === "choose-editor" && (
            <WelcomeScreen
              targets={props.targets}
              originalLinkProps={dialog()![1]!}
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

function RuntimeWrapper(props: RuntimeProps) {
  const options = useOptions();

  const isDisabled = () => options.getOptions().disabled || false;

  createEffect(() => {
    if (isDisabled() && isExtension()) {
      document.head.dataset.locatorDisabled = "disabled";
    } else {
      delete document.head.dataset.locatorDisabled;
    }
  });

  return (
    <Show when={!isDisabled()}>
      <Runtime {...props} />
    </Show>
  );
}

export function initRender(
  solidLayer: HTMLDivElement,
  adapter: AdapterId | undefined,
  targets: SetupTargets
) {
  render(
    () => (
      <OptionsProvider>
        <RuntimeWrapper
          targets={Object.fromEntries(
            Object.entries(targets).map(([key, t]) => {
              return [key, typeof t == "string" ? { url: t, label: key } : t];
            })
          )}
          adapterId={adapter}
        />
      </OptionsProvider>
    ),
    solidLayer
  );
}
