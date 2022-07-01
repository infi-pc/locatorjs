/* eslint-disable react/no-unknown-property */
import { Fiber } from "@locator/shared";
import { createEffect, createSignal, For, onCleanup, onMount } from "solid-js";
import { render } from "solid-js/web";
import { Adapter, HREF_TARGET } from "./consts";
import { fiberToSimple } from "./adapters/react/fiberToSimple";
import { gatherFiberRoots } from "./adapters/react/gatherFiberRoots";
import { getElementInfo } from "./adapters/react/reactAdapter";
import { isCombinationModifiersPressed } from "./isCombinationModifiersPressed";
import { Outline } from "./Outline";
import { RenderXrayNode } from "./RenderNode";
import { searchDevtoolsRenderersForClosestTarget } from "./searchDevtoolsRenderersForClosestTarget";
import { trackClickStats } from "./trackClickStats";
import { SimpleNode } from "./types";

function Runtime(props: { adapter: Adapter }) {
  const [solidMode, setSolidMode] = createSignal<null | "tree">(null);
  const [holdingModKey, setHoldingModKey] = createSignal<boolean>(false);
  const [currentElement, setCurrentElement] = createSignal<HTMLElement | null>(
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
    if (solidMode() === "tree") {
      document.body.classList.add("locatorjs-move-body");
    } else {
      document.body.classList.remove("locatorjs-move-body");
    }
  });

  function keyUpListener(e: KeyboardEvent) {
    if (e.code === "KeyO" && isCombinationModifiersPressed(e)) {
      setSolidMode(solidMode() === "tree" ? null : "tree");
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
      setCurrentElement(target);

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
    if (solidMode() === "tree") {
      const foundFiberRoots: Fiber[] = [];

      gatherFiberRoots(document.body, foundFiberRoots);

      const simpleRoots = foundFiberRoots.map((fiber) => {
        return fiberToSimple(fiber);
      });

      return simpleRoots;
    } else {
      return [];
    }
  };

  return (
    <>
      {solidMode() === "tree" ? (
        <div
          id="locator-solid-overlay"
          onClick={(e) => {
            setSolidMode(null);
          }}
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
            {(node, i) => <TreeNode node={node} />}
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
      {(() => {
        if (!holdingModKey()) {
          return null;
        }
        const el = currentElement();
        if (!el) {
          return null;
        }
        const elInfo = getElementInfo(el);
        if (!elInfo) {
          return null;
        }
        return <Outline element={elInfo} />;
      })()}
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

function TreeNode({ node }: { node: SimpleNode }) {
  return (
    <div
      style={{
        "padding-left": "1em",
        "font-size": "14px",
        "font-family": "monospace",
      }}
    >
      <div>
        {"<"}
        {node.name}
        {">"}
      </div>
      {node.type === "component" && node.source?.fileName ? (
        <div
          style={{
            border: "1px solid #ccc",
            padding: "0.5em",
          }}
        >
          <div
            style={{
              "font-size": "12px",
              display: "flex",
              "justify-content": "space-between",
              "font-family": "Helvitica, sans-serif",
            }}
          >
            <div
              style={{
                "font-weight": "bold",
              }}
            >
              {node.name}:
            </div>{" "}
            <div
              style={{
                color: "#888",
              }}
            >
              {node.source?.fileName}
            </div>
          </div>
          <For each={node.children}>
            {(child, i) => <TreeNode node={child} />}
          </For>
        </div>
      ) : (
        <For each={node.children}>
          {(child, i) => <TreeNode node={child} />}
        </For>
      )}
    </div>
  );
}
