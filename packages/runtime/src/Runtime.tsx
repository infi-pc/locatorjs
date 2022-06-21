/* eslint-disable react/no-unknown-property */
import { Fiber } from "@locator/shared";
import { createEffect, createSignal, For, onCleanup, onMount } from "solid-js";
import { render } from "solid-js/web";
import { fiberToSimple } from "./fiberToSimple";
import { gatherFiberRoots } from "./gatherFiberRoots";
import { isCombinationModifiersPressed } from "./isCombinationModifiersPressed";
import { RenderXrayNode } from "./RenderNode";

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

  function globalKeyUpListener(e: KeyboardEvent) {
    if (e.code === "KeyO" && isCombinationModifiersPressed(e)) {
      setSolidMode(solidMode() === "xray" ? null : "xray");
    }
  }

  document.addEventListener("keyup", globalKeyUpListener);

  onCleanup(() => {
    document.removeEventListener("keyup", globalKeyUpListener);
  });

  const getFoundNodes = (): SimpleNode[] => {
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
      {solidMode() ? (
        <div
          id="locator-solid-overlay"
          onClick={(e) => {
            setSolidMode(null);
          }}
        >
          <For each={getFoundNodes()}>
            {(node, i) => (
              <RenderXrayNode node={node} parentIsHovered={false} />
            )}
          </For>
        </div>
      ) : null}
    </>
  );
}

export function initRender(solidLayer: HTMLDivElement) {
  render(() => <Runtime />, solidLayer);
}
