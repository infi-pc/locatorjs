/* eslint-disable react/no-unknown-property */
import { Fiber } from "@locator/shared";
import { createEffect, createSignal, For, onCleanup, onMount } from "solid-js";
import { render } from "solid-js/web";
import { fiberToSimple } from "./fiberToSimple";
import { gatherFiberRoots } from "./gatherFiberRoots";
import { isCombinationModifiersPressed } from "./isCombinationModifiersPressed";
import { Outline } from "./Outline";
import { RenderXrayNode } from "./RenderNode";
import { searchDevtoolsRenderersForClosestTarget } from "./searchDevtoolsRenderersForClosestTarget";

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

  function keyUpListener(e: KeyboardEvent) {
    if (e.code === "KeyO" && isCombinationModifiersPressed(e)) {
      setSolidMode(solidMode() === "xray" ? null : "xray");
    }

    setHoldingModKey(isCombinationModifiersPressed(e));
  }

  function keyDownListener(e: KeyboardEvent) {
    setHoldingModKey(isCombinationModifiersPressed(e));
  }

  function mouseOverListener(e: MouseEvent) {
    const target = e.target;
    if (target && target instanceof HTMLElement) {
      if (
        target.className == "locatorjs-label" ||
        target.id == "locatorjs-labels-section"
      ) {
        return;
      }

      const found =
        target.closest("[data-locatorjs-id]") ||
        searchDevtoolsRenderersForClosestTarget(target);
      if (found && found instanceof HTMLElement) {
        setCurrentElement(found);
      }
    }
  }

  document.addEventListener("mouseover", mouseOverListener, {
    capture: true,
  });
  document.addEventListener("keydown", keyDownListener);
  document.addEventListener("keyup", keyUpListener);

  onCleanup(() => {
    document.removeEventListener("keyup", keyUpListener);
    document.removeEventListener("keydown", keyDownListener);
    document.removeEventListener("mouseover", mouseOverListener, {
      capture: true,
    });
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
      {holdingModKey() && currentElement() ? (
        <Outline element={currentElement()!} />
      ) : null}
    </>
  );
}

export function initRender(solidLayer: HTMLDivElement) {
  render(() => <Runtime />, solidLayer);
}
