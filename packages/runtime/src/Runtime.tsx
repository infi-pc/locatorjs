import { Fiber } from "@locator/shared";
import { children, createEffect, createSignal, For, onCleanup } from "solid-js";
import { render, template } from "solid-js/web";
import { findFiberByHtmlElement } from "./findFiberByHtmlElement";
import { getFiberLabel } from "./getFiberLabel";
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

      const simpleRoots = foundFiberRoots.map((fiber) => {
        return fiberToSimple(fiber);
      });

      return simpleRoots;
    } else {
      return [];
    }
  };

  // createEffect(() => {});

  return (
    <div>
      SOLID RUNTIME!!! mode: {solidMode()}{" "}
      <For each={getFoundNodes()}>
        {(node, i) => <RenderNode node={node} />}
      </For>
    </div>
  );
}

function RenderNode({ node }: { node: SimpleNode }) {
  return (
    <>
      {node.box ? (
        <div
          style={{
            position: "absolute",
            left: node.box.left + "px",
            top: node.box.top + "px",
            width: node.box.width + "px",
            height: node.box.height + "px",
            border:
              node.type === "component" ? "2px solid green" : "1px solid red",
            "border-radius": "4px",
            "z-index": node.type === "component" ? 1000 : 10,
          }}
        >
          <div
            style={{
              padding: "1px 4px",
              background:
                node.type === "component"
                  ? "rgba(0,200,0,0.2)"
                  : "rgba(200,0,0,0.2)",
              color:
                node.type === "component"
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
            {node.name}
          </div>
        </div>
      ) : null}
      <For each={node.children}>{(node, i) => <RenderNode node={node} />}</For>
    </>
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
