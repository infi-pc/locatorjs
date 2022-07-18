import { Fiber } from "@locator/shared";
import { batch, createEffect, createSignal, For, onCleanup } from "solid-js";
import { render } from "solid-js/web";
import { Adapter, HREF_TARGET } from "./consts";
import { fiberToSimple } from "./adapters/react/fiberToSimple";
import { gatherFiberRoots } from "./adapters/react/gatherFiberRoots";
import reactAdapter from "./adapters/react/reactAdapter";
import { isCombinationModifiersPressed } from "./isCombinationModifiersPressed";
import { trackClickStats } from "./trackClickStats";
import { SimpleNode, Targets } from "./types";
import { getIdsOnPathToRoot } from "./getIdsOnPathToRoot";
import { RootTreeNode } from "./RootTreeNode";
import { MaybeOutline } from "./MaybeOutline";
import { SimpleNodeOutline } from "./SimpleNodeOutline";
import { hasExperimentalFeatures } from "./hasExperimentalFeatures";
import jsxAdapter from "./adapters/jsx/jsxAdapter";
import { AdapterObject } from "./adapters/adapterApi";
import LogoIcon from "./LogoIcon";
import { IntroInfo } from "./IntroInfo";

function Runtime(props: { adapter: AdapterObject; targets: Targets }) {
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
    if (hasExperimentalFeatures()) {
      if (e.code === "KeyO" && isCombinationModifiersPressed(e)) {
        if (solidMode()[0] === "tree") {
          setSolidMode(["off"]);
        } else {
          setSolidMode(["tree"]);
        }
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
      // Ignore LocatorJS elements
      if (
        target.className == "locatorjs-label" ||
        target.id == "locatorjs-labels-section" ||
        target.id == "locatorjs-layer" ||
        target.id == "locatorjs-wrapper" ||
        target.matches("#locatorjs-wrapper *")
      ) {
        return;
      }

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

  function clickListener(e: MouseEvent) {
    if (!isCombinationModifiersPressed(e)) {
      return;
    }

    const target = e.target;
    if (target && target instanceof HTMLElement) {
      if (target.matches("#locatorjs-wrapper *")) {
        return;
      }

      const elInfo = props.adapter.getElementInfo(target);

      if (elInfo) {
        const link = elInfo.thisElement.link;
        if (link) {
          e.preventDefault();
          e.stopPropagation();
          trackClickStats();
          window.open(link, HREF_TARGET);
        } else {
          alert("No link found");
        }
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
            bottom: "10px",
            left: "10px",
            background: "rgba(255,255,255)",
            padding: "4px 8px",
            "padding-top": "10px",
            "box-shadow":
              "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1), 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
            "border-radius": "8px",
            border: "red 2px solid",
          }}
        >
          <LogoIcon />
          <div>Settings</div>
        </div>
      ) : null}
      {holdingModKey() && currentElement() ? (
        <MaybeOutline
          currentElement={currentElement()!}
          showTreeFromElement={showTreeFromElement}
          adapter={props.adapter}
        />
      ) : null}
      {highlightedNode() ? (
        <SimpleNodeOutline node={highlightedNode()!} />
      ) : null}
      <IntroInfo />
      {/* {holdingModKey() &&
      currentElement() &&
      getElementInfo(currentElement()!) ? (
        <Outline element={getElementInfo(currentElement()!)!} />
      ) : null} */}
    </>
  );
}

export function initRender(
  solidLayer: HTMLDivElement,
  adapter: Adapter,
  targets: Targets
) {
  const adapterObject = adapter === "jsx" ? jsxAdapter : reactAdapter;
  render(
    () => <Runtime adapter={adapterObject} targets={targets} />,
    solidLayer
  );
}
