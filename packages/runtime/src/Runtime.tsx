/* eslint-disable react/no-unknown-property */
import { Fiber } from "@locator/shared";
import {
  batch,
  createEffect,
  createSignal,
  For,
  onCleanup,
  onMount,
} from "solid-js";
import { render } from "solid-js/web";
import { Adapter, HREF_TARGET } from "./consts";
import { fiberToSimple } from "./adapters/react/fiberToSimple";
import { gatherFiberRoots } from "./adapters/react/gatherFiberRoots";
import { getElementInfo } from "./adapters/react/reactAdapter";
import { isCombinationModifiersPressed } from "./isCombinationModifiersPressed";
import { Outline } from "./Outline";
import { RenderNode } from "./RenderNode";
import { searchDevtoolsRenderersForClosestTarget } from "./searchDevtoolsRenderersForClosestTarget";
import { trackClickStats } from "./trackClickStats";
import { SimpleNode } from "./types";
import { getPathToParent } from "./getPathToParent";
import { getIdsOnPathToRoot } from "./getIdsOnPathToRoot";
import { RootTreeNode } from "./RootTreeNode";
import { MaybeOutline } from "./MaybeOutline";
import { findFiberByHtmlElement } from "./adapters/react/findFiberByHtmlElement";
import { makeFiberId } from "./adapters/react/makeFiberId";
import { SimpleNodeOutline } from "./SimpleNodeOutline";

function Runtime(props: { adapter: Adapter }) {
  const [solidMode, setSolidMode] = createSignal<
    ["off"] | ["tree"] | ["treeFromElement", HTMLElement]
  >(["off"]);
  const [holdingModKey, setHoldingModKey] = createSignal<boolean>(false);
  const [currentElement, setCurrentElement] = createSignal<HTMLElement | null>(
    null
  );

  const [highlightedNode, setHighlightedNode] = createSignal<null | SimpleNode>(
    null
  );

  createEffect(() => {
    if (holdingModKey() && currentElement()) {
      document.body.classList.add("locatorjs-active-pointer");
    } else {
      document.body.classList.remove("locatorjs-active-pointer");
    }
  });

  createEffect(() => {
    if (solidMode()[0] === "tree" || solidMode()[0] === "treeFromElement") {
      document.body.classList.add("locatorjs-move-body");
    } else {
      document.body.classList.remove("locatorjs-move-body");
    }
  });

  function keyUpListener(e: KeyboardEvent) {
    if (e.code === "KeyO" && isCombinationModifiersPressed(e)) {
      if (solidMode()[0] === "tree") {
        setSolidMode(["off"]);
      } else {
        setSolidMode(["tree"]);
      }
    }

    setHoldingModKey(isCombinationModifiersPressed(e));
  }

  function keyDownListener(e: KeyboardEvent) {
    setHoldingModKey(isCombinationModifiersPressed(e));
  }

  function mouseOverListener(e: MouseEvent) {
    setHoldingModKey(isCombinationModifiersPressed(e));

    const target = e.target;
    if (target && target instanceof HTMLElement) {
      if (
        target.className == "locatorjs-label" ||
        target.id == "locatorjs-labels-section" ||
        target.id == "locatorjs-layer" ||
        target.id == "locatorjs-wrapper"
      ) {
        return;
      }
      if (target.matches("#locatorjs-wrapper *")) {
        return;
      }

      batch(() => {
        setCurrentElement(target);
        if (solidMode()[0] === "tree" || solidMode()[0] === "treeFromElement") {
          const fiber = findFiberByHtmlElement(target, false);
          if (fiber) {
            const id = fiberToSimple(fiber, []);

            setHighlightedNode(id);
          }
        }
      });

      // const found =
      //   target.closest("[data-locatorjs-id]") ||
      //   searchDevtoolsRenderersForClosestTarget(target);
      // if (found && found instanceof HTMLElement) {
      //   setCurrentElement(found);
      // }
    }
  }

  function clickListener(e: MouseEvent) {
    if (!isCombinationModifiersPressed(e)) {
      return;
    }

    const target = e.target;
    if (target && target instanceof HTMLElement) {
      if (target.matches("#locatorjs-wrapper *")) {
        return;
      }

      const elInfo = getElementInfo(target);

      if (elInfo) {
        const link = elInfo.thisElement.link;
        e.preventDefault();
        e.stopPropagation();
        trackClickStats();
        window.open(link, HREF_TARGET);
      }
    }
  }

  function scrollListener() {
    setCurrentElement(null);
  }

  document.addEventListener("mouseover", mouseOverListener, {
    capture: true,
  });
  document.addEventListener("keydown", keyDownListener);
  document.addEventListener("keyup", keyUpListener);
  document.addEventListener("click", clickListener, { capture: true });
  document.addEventListener("scroll", scrollListener);

  onCleanup(() => {
    document.removeEventListener("keyup", keyUpListener);
    document.removeEventListener("keydown", keyDownListener);
    document.removeEventListener("mouseover", mouseOverListener, {
      capture: true,
    });
    document.removeEventListener("click", clickListener, { capture: true });
    document.removeEventListener("scroll", scrollListener);
  });

  const getAllNodes = (): SimpleNode[] => {
    if (solidMode()[0] === "tree" || solidMode()[0] === "treeFromElement") {
      const foundFiberRoots: Fiber[] = [];

      gatherFiberRoots(document.body, foundFiberRoots);

      const simpleRoots = foundFiberRoots.map((fiber) => {
        return fiberToSimple(fiber);
      });

      return simpleRoots;
    }
    //  else if () {
    //   const pathToParentTree = getIdsOnPathToRoot(solidMode()[1]!);
    //   if (pathToParentTree) {
    //     return [pathToParentTree];
    //   }
    // }
    return [];
  };

  function showTreeFromElement(element: HTMLElement) {
    setSolidMode(["treeFromElement", element]);
  }

  return (
    <>
      {solidMode()[0] === "tree" || solidMode()[0] === "treeFromElement" ? (
        <div
          id="locator-solid-overlay"
          // onClick={(e) => {
          //   setSolidMode(["off"]);
          // }}
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            width: "50vw",
            height: "100vh",
            overflow: "auto",
            "pointer-events": "auto",
          }}
        >
          <For each={getAllNodes()}>
            {(node, i) => (
              <RootTreeNode
                node={node}
                idsToShow={
                  solidMode()[0] === "treeFromElement"
                    ? getIdsOnPathToRoot(solidMode()[1]!)
                    : {}
                }
                highlightedNode={{
                  getNode: highlightedNode,
                  setNode: (newId) => {
                    setHighlightedNode(newId);
                  },
                }}
              />
            )}
          </For>
          {/* <For each={getAllNodes()}>
            {(node, i) => (
              <RenderXrayNode node={node} parentIsHovered={false} />
            )}
          </For> */}
        </div>
      ) : null}
      {holdingModKey() ? (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            background: "rgba(255,255,255,0.5)",
          }}
        >
          LocatorJS
        </div>
      ) : null}
      {holdingModKey() && currentElement() ? (
        <MaybeOutline
          currentElement={currentElement()!}
          showTreeFromElement={showTreeFromElement}
        />
      ) : null}
      {highlightedNode() ? (
        <SimpleNodeOutline node={highlightedNode()!} />
      ) : null}
      {/* {holdingModKey() &&
      currentElement() &&
      getElementInfo(currentElement()!) ? (
        <Outline element={getElementInfo(currentElement()!)!} />
      ) : null} */}
    </>
  );
}

export function initRender(solidLayer: HTMLDivElement, adapter: Adapter) {
  render(() => <Runtime adapter={adapter} />, solidLayer);
}
