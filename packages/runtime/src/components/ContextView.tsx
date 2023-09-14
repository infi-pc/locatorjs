import { Targets } from "@locator/shared";
import { AdapterId } from "../consts";
import { TreeNode, TreeNodeElement } from "../types/TreeNode";
import { TreeState } from "../adapters/adapterApi";
import { TreeNodeElementView } from "./TreeNodeElementView";
import { createEffect, createSignal } from "solid-js";
import { computePosition, flip, shift, offset } from "@floating-ui/dom";
import { ContextMenuState } from "../types/types";

export function ContextView(props: {
  contextMenuState: ContextMenuState;
  close: () => void;
  adapterId?: AdapterId | undefined;
  targets: Targets;
  setHighlightedNode: (node: null | TreeNode) => void;
}) {
  let contentRef: HTMLDivElement | undefined;

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
          top: `${props.contextMenuState.y || 0}px`,
          left: `${props.contextMenuState.x || 0}px`,
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
