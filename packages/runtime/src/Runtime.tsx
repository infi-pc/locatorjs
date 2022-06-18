import { Fiber } from "@locator/shared";
import { children, createEffect, createSignal, For, onCleanup } from "solid-js";
import { render, template } from "solid-js/web";
import { findFiberByHtmlElement } from "./findFiberByHtmlElement";
import { getFiberLabel } from "./getFiberLabel";
import { getUsableName } from "./getUsableName";
import { isCombinationModifiersPressed } from "./isCombinationModifiersPressed";

type Pair = {
  element?: Element | Text;
  fiber: Fiber;
  box: DOMRect;
  type: "element" | "component";
};

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

  const getFoundPairs = () => {
    if (solidMode() === "xray") {
      const foundPairs: Pair[] = [];
      const foundFiberRoots: Fiber[] = [];

      gatherFiberRoots(document.body, foundFiberRoots);

      foundFiberRoots.forEach((fiber) => {
        gatherFiberChildren(fiber, foundPairs);
      });

      return foundPairs;
    } else {
      return [];
    }
  };

  // createEffect(() => {});

  return (
    <div>
      SOLID RUNTIME!!! mode: {solidMode()}{" "}
      <For each={getFoundPairs()}>
        {(pair, i) => (
          <div
            style={{
              position: "absolute",
              left: pair.box.left + "px",
              top: pair.box.top + "px",
              width: pair.box.width + "px",
              height: pair.box.height + "px",
              border:
                pair.type === "component" ? "4px solid green" : "1px solid red",
              "border-radius": "4px",
            }}
          >
            <div
              style={{
                padding: "1px 4px",
                background:
                  pair.type === "component"
                    ? "rgba(0,200,0,0.2)"
                    : "rgba(200,0,0,0.2)",
                color:
                  pair.type === "component"
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
              {getUsableName(pair.fiber)}
            </div>
          </div>
        )}
      </For>
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
      const fiber = (node as any)._reactRootContainer?._internalRoot?.current;
      if (fiber) {
        mutable_foundFibers.push(fiber);
      } else {
        gatherFiberRoots(node, mutable_foundFibers);
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

function gatherFiberChildren(fiber: Fiber, mutable_foundPairs: Pair[]) {
  const node =
    fiber.stateNode instanceof Element || fiber.stateNode instanceof Text
      ? fiber.stateNode
      : fiber.stateNode?.containerInfo;

  if (node) {
    const box = getBoundingRect(node);
    if (box) {
      mutable_foundPairs.push({
        fiber,
        element: node,
        box: box,
        type: "element",
      });
    }
  } else {
    if (fiber.elementType?.name) {
      const box = getComposedBoundingBox(fiber);
      if (box) {
        console.log("Creating comp");
        mutable_foundPairs.push({
          fiber,
          element: node,
          box: box,
          type: "component",
        });
      }
    }

    console.log("NO NODE", fiber);
  }

  const children = getAllFiberChildren(fiber);
  for (const child of children) {
    gatherFiberChildren(child, mutable_foundPairs);
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

// type DOMRectLike = {
//   left: number;
//   top: number;
//   width: number;
//   height: number;
// };
function mergeRects(a: DOMRect, b: DOMRect): DOMRect {
  const newRect = new DOMRect();

  newRect.x = Math.min(a.x, b.x);
  newRect.y = Math.min(a.y, b.y);
  newRect.width = Math.max(a.x + a.width, b.x + b.width) - newRect.x;
  newRect.height = Math.max(a.y + a.height, b.y + b.height) - newRect.y;

  return newRect;
  // return {
  //   left: Math.min(a.x, b.x),
  //   top: Math.min(a.y, b.y),
  //   width: Math.max(a.right, b.right) - Math.min(a.x, b.x),
  //   height: Math.max(a.bottom, b.bottom) - Math.min(a.y, b.y),

  // };
}

function getComposedBoundingBox(fiber: Fiber): DOMRect | null {
  let composedRect: DOMRect | null = null;
  const children = getAllFiberChildren(fiber);
  children.forEach((child) => {
    const rect = getBoundingRect(child.stateNode);
    if (rect) {
      if (composedRect) {
        composedRect = mergeRects(composedRect, rect);
      } else {
        composedRect = rect;
      }
    }
  });
  return composedRect;
}

export function initRender(solidLayer: HTMLDivElement) {
  render(() => <Runtime />, solidLayer);
}
