/* eslint-disable react/no-unknown-property */
import { Fiber } from "@locator/shared";
import { createEffect, createSignal, For, onCleanup, onMount } from "solid-js";
import { render } from "solid-js/web";
import { findFiberByHtmlElement } from "./findFiberByHtmlElement";
import { getUsableName } from "./getUsableName";
import { isCombinationModifiersPressed } from "./isCombinationModifiersPressed";

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

type SimpleNode = SimpleElement | SimpleComponent;

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

  // const renderers = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers;

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

  createEffect(() => {
    if (solidMode()) {
      document.body.classList.add("locator-solid-mode");
    } else {
      document.body.classList.remove("locator-solid-mode");
    }
  });
  return (
    <>
      {solidMode() ? (
        <div
          id="locator-solid-overlay"
          onClick={(e) => {
            setSolidMode(null);
          }}
        >
          <div
            style={{
              transform: "scale(0.7)",
            }}
          >
            <For each={getFoundNodes()}>
              {(node, i) => <RenderNode node={node} parentIsHovered={false} />}
            </For>
          </div>
        </div>
      ) : null}
    </>
  );
}

function RenderNode(props: { node: SimpleNode; parentIsHovered: boolean }) {
  const [isHovered, setIsHovered] = createSignal(false);

  createEffect(() => {
    console.log("RenderNode", props.node, props.parentIsHovered, isHovered());
  });

  const offset = props.node.type === "component" ? 2 : 0;
  return (
    <div>
      {props.node.box ? (
        <div
          onMouseEnter={
            props.node.type === "component"
              ? () => setIsHovered(true)
              : undefined
          }
          onMouseLeave={
            props.node.type === "component"
              ? () => setIsHovered(false)
              : undefined
          }
          style={{
            position: "absolute",
            left: props.node.box.left - offset + "px",
            top: props.node.box.top - offset + "px",
            width: props.node.box.width + offset * 2 + "px",
            height: props.node.box.height + offset * 2 + "px",
            border:
              isHovered() || props.parentIsHovered
                ? props.node.type === "component"
                  ? "2px solid rgba(100,0,0,1)"
                  : "1px solid rgba(200,0,0,0.6)"
                : props.node.type === "component"
                ? "0px solid rgba(200,0,0,1)"
                : "0px solid rgba(200,0,0,0.1)",
            "border-radius": props.node.type === "component" ? "5px" : "3px",
            "z-index": props.node.type === "component" ? 1000 : 10,
            // transform: "scale(0.98)",
          }}
        >
          {props.node.type === "component" || props.parentIsHovered ? (
            <div
              style={{
                padding: "1px 4px",
                background:
                  props.node.type === "component" ? "rgba(0,200,0,0.2)" : "",
                color:
                  props.node.type === "component"
                    ? "rgba(50,150,50,1)"
                    : "rgba(150,50,50,1)",
                position: "absolute",
                "font-size": "12px",
                "border-radius": "0px 0px 4px 4px",
                // top: "-20px",
                height: "20px",
                "white-space": "nowrap",
              }}
            >
              {props.node.name}
            </div>
          ) : null}
        </div>
      ) : null}
      {props.node.type === "component" ? (
        <For each={props.node.children}>
          {(childNode, i) => {
            if (
              childNode.type === "element" &&
              childNode.element instanceof HTMLElement &&
              childNode.box
            ) {
              return (
                <RenderNodeClone
                  element={childNode.element}
                  box={childNode.box}
                  isHovered={isHovered()}
                />
              );
            }

            return null;
          }}
        </For>
      ) : null}
      <For each={props.node.children}>
        {(childNode, i) => {
          return (
            <RenderNode
              node={childNode}
              parentIsHovered={
                isHovered() ||
                (props.node.type === "element" && props.parentIsHovered)
              }
            />
          );
        }}
      </For>
    </div>
  );
}

function RenderNodeClone(props: {
  element: HTMLElement;
  box: DOMRect;
  isHovered: boolean;
}) {
  let myDiv: HTMLDivElement | undefined;

  onMount(() => {
    if (myDiv) {
      const clone = props.element.cloneNode(true);
      myDiv.appendChild(clone);

      // html2canvas(document.body).then(function (canvas) {
      //   myDiv!.appendChild(canvas);
      // });
    }
  });
  return (
    <div
      style={{
        position: "absolute",
        left: props.box.left + "px",
        top: props.box.top + "px",
        width: props.box.width + "px",
        height: props.box.height + "px",
        "box-shadow":
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1), 0 25px 50px -12px rgb(0 0 0 / 0.25)",
        background: "rgba(255,255,255,1)",
        // "backdrop-filter": "blur(20px)",
        "border-radius": "5px",
        cursor: "pointer",
        overflow: "hidden",
        transform: props.isHovered ? "scale(1)" : "scale(0.97)",
        // transform: "translate(-5px, -5px) scale(0.9)",
      }}
      // eslint-disable-next-line react/no-unknown-property
      class="locator-cloned-element"
    >
      <div
        ref={myDiv}
        style={{
          "pointer-events": "none",
        }}
      ></div>
    </div>
  );
}
// function gatherNodes(parentNode: HTMLElement, mutable_foundPairs: Pair[]) {
//   const nodes = parentNode.childNodes;
//   for (let i = 0; i < nodes.length; i++) {
//     const node = nodes[i];
//     if (node instanceof HTMLElement) {
//       const fiber = findFiberByHtmlElement(node!, false);
//       if (fiber) {
//         mutable_foundPairs.push({
//           element: node,
//           fiber,
//           box: node.getBoundingClientRect(),
//         });
//       }
//       //  else {
//       // }
//       gatherNodes(node, mutable_foundPairs);
//     }
//   }
// }

// $0.

// function findGlobalRoots(): Fiber[] {
//   const foundRootPairs: Pair[] = [];
//   gatherRootNodes(document.body, foundRootPairs);
//   const set = new Set<Fiber>();
//   for (const rootPair of foundRootPairs) {
//     const globalRoot = findRoot(rootPair.fiber);
//     set.add(globalRoot);
//   }
//   return [...set.values()];
// }

// function findRoot(fiber: Fiber): Fiber {
//   if (fiber.return) {
//     return findRoot(fiber.return);
//   } else {
//     return fiber;
//   }
// }

// function gatherRootNodes(parentNode: HTMLElement, mutable_foundPairs: Pair[]) {
//   const nodes = parentNode.childNodes;
//   for (let i = 0; i < nodes.length; i++) {
//     const node = nodes[i];
//     if (node instanceof HTMLElement) {
//       const fiber = findFiberByHtmlElement(node!, false);
//       if (fiber) {
//         mutable_foundPairs.push({
//           element: node,
//           fiber,
//           box: node.getBoundingClientRect(),
//         });
//       } else {
//         gatherRootNodes(node, mutable_foundPairs);
//       }
//     }
//   }
// }

function gatherFiberRoots(
  parentNode: HTMLElement,
  mutable_foundFibers: Fiber[]
) {
  const nodes = parentNode.childNodes;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node instanceof HTMLElement) {
      const fiber =
        (node as any)._reactRootContainer?._internalRoot?.current ||
        (node as any)._reactRootContainer?.current;
      if (fiber) {
        mutable_foundFibers.push(fiber);
      } else {
        const rootFiber = findFiberByHtmlElement(node!, false);
        if (rootFiber) {
          mutable_foundFibers.push(rootFiber);
        } else {
          gatherFiberRoots(node, mutable_foundFibers);
        }
      }
    }
  }
}

function getAllFiberChildren(fiber: Fiber) {
  const allChildren: Fiber[] = [];
  let child = fiber.child;
  while (child) {
    allChildren.push(child);
    child = child.sibling;
  }
  return allChildren;
}

function fiberToSimple(fiber: Fiber): SimpleNode {
  const children = getAllFiberChildren(fiber);

  const simpleChildren = children.map((child) => {
    return fiberToSimple(child);
  });
  const element =
    fiber.stateNode instanceof Element || fiber.stateNode instanceof Text
      ? fiber.stateNode
      : fiber.stateNode?.containerInfo;

  if (element) {
    const box = getBoundingRect(element);
    return {
      type: "element",
      element: element,
      fiber: fiber,
      name: getUsableName(fiber),
      box: box || getComposedBoundingBox(simpleChildren),
      children: simpleChildren,
    };
  } else {
    return {
      type: "component",
      fiber: fiber,
      name: getUsableName(fiber),
      box: getComposedBoundingBox(simpleChildren),
      children: simpleChildren,
    };
  }
}

function getBoundingRect(node: Element | Text): DOMRect | null {
  if (node instanceof Element) {
    return node.getBoundingClientRect();
  } else if (node instanceof Text) {
    const range = document.createRange();
    range.selectNodeContents(node);
    return range.getBoundingClientRect();
  } else {
    return null;
  }
}

function mergeRects(a: DOMRect, b: DOMRect): DOMRect {
  const newRect = new DOMRect();

  newRect.x = Math.min(a.x, b.x);
  newRect.y = Math.min(a.y, b.y);
  newRect.width = Math.max(a.x + a.width, b.x + b.width) - newRect.x;
  newRect.height = Math.max(a.y + a.height, b.y + b.height) - newRect.y;

  return newRect;
}

function getComposedBoundingBox(children: SimpleNode[]): DOMRect | null {
  let composedRect: DOMRect | null = null;

  children.forEach((child) => {
    const box = child.box;
    if (!box) {
      return;
    }
    if (box.width <= 0 || box.height <= 0) {
      // ignore zero-sized rects
      return;
    }
    if (composedRect) {
      composedRect = mergeRects(composedRect, box);
    } else {
      composedRect = box;
    }
  });
  return composedRect;
}

export function initRender(solidLayer: HTMLDivElement) {
  render(() => <Runtime />, solidLayer);
}
