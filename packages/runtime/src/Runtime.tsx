/* eslint-disable react/no-unknown-property */
import { Fiber } from "@locator/shared";
import { createEffect, createSignal, For, onCleanup, onMount } from "solid-js";
import { render } from "solid-js/web";
import { HREF_TARGET } from "./consts";
import { fiberToSimple } from "./adapters/react/fiberToSimple";
import { gatherFiberRoots } from "./adapters/react/gatherFiberRoots";
import { getElementInfo } from "./adapters/react/reactAdapter";
import { isCombinationModifiersPressed } from "./isCombinationModifiersPressed";
import { Outline } from "./Outline";
import { RenderXrayNode } from "./RenderNode";
import { searchDevtoolsRenderersForClosestTarget } from "./searchDevtoolsRenderersForClosestTarget";
import { trackClickStats } from "./trackClickStats";

type SimpleElement = {
  type: "element";
  name: string;
  fiber: Fiber;
  box: DOMRect | null;
  element: Element | Text;
  children: (SimpleElement | SimpleComponent)[];
};

type SimpleComponent = {
  type: "component";
  name: string;
  fiber: Fiber;
  box: DOMRect | null;
  children: (SimpleElement | SimpleComponent)[];
};

export type SimpleNode = SimpleElement | SimpleComponent;

function Runtime() {
  const [solidMode, setSolidMode] = createSignal<null | "xray">(null);
  const [holdingModKey, setHoldingModKey] = createSignal<boolean>(false);
  const [currentElement, setCurrentElement] = createSignal<HTMLElement | null>(
    null
  );

  createEffect(() => {
    console.log({ holding: holdingModKey(), currentElement: currentElement() });
  });

  createEffect(() => {
    if (holdingModKey() && currentElement()) {
      document.body.classList.add("locatorjs-active-pointer");
    } else {
      document.body.classList.remove("locatorjs-active-pointer");
    }
  });

  function keyUpListener(e: KeyboardEvent) {
    // XRay is disabled for now
    // if (e.code === "KeyO" && isCombinationModifiersPressed(e)) {
    //   setSolidMode(solidMode() === "xray" ? null : "xray");
    // }

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
    if (solidMode() === "xray") {
      const foundFiberRoots: Fiber[] = [];

      gatherFiberRoots(document.body, foundFiberRoots);

      console.log({ foundFiberRoots });
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
      {solidMode() === "xray" ? (
        <div
          id="locator-solid-overlay"
          onClick={(e) => {
            setSolidMode(null);
          }}
        >
          <For each={getAllNodes()}>
            {(node, i) => (
              <RenderXrayNode node={node} parentIsHovered={false} />
            )}
          </For>
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

export function initRender(solidLayer: HTMLDivElement) {
  render(() => <Runtime />, solidLayer);
}
