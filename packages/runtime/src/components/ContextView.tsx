import { Targets } from "@locator/shared";
import { AdapterId } from "../consts";
import { TreeNode, TreeNodeElement } from "../types/TreeNode";
import { TreeState } from "../adapters/adapterApi";
import { TreeNodeElementView } from "./TreeNodeElementView";
import { createEffect, createSignal } from "solid-js";
import { computePosition, flip, shift, offset } from "@floating-ui/dom";

export function ContextView(props: {
  element: HTMLElement;
  close: () => void;
  adapterId?: AdapterId | undefined;
  targets: Targets;
  setHighlightedNode: (node: null | TreeNode) => void;
}) {
  let contentRef: HTMLDivElement | undefined;

  const [pos, setPos] = createSignal<{ x: number; y: number }>();
  createEffect(() => {
    if (contentRef) {
      computePosition(
        {
          getBoundingClientRect: () => props.element.getBoundingClientRect(),
        },
        contentRef,
        {
          placement: "bottom-start",
          middleware: [offset(10), shift(), flip()],
        }
      ).then(({ x, y }) => {
        setPos({ x, y });
      });
    }
  });
  return (
    <div
      style={{
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        "pointer-events": "auto",
        "background-color": "rgba(0,0,0,0.1)",
        "z-index": 1001,
      }}
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          props.close();
        }
      }}
    >
      <div
        style={{
          position: "absolute",
          // top: `${(props.treeState?.originalNode.getBox()?.y || 0) + 24}px`,
          top: `${pos()?.y || 0}px`,
          left: `${pos()?.x || 0}px`,
        }}
        ref={contentRef}
      >
        <div
          class={"m-2 bg-white rounded-md p-4 shadow-xl text-xs overflow-auto"}
          style={{
            "max-height": "calc(100vh - 16px)",
          }}
        >
          hello
        </div>
      </div>
    </div>
  );
}
