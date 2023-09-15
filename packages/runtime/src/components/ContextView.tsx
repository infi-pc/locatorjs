import { Targets } from "@locator/shared";
import { AdapterId } from "../consts";
import { TreeNode } from "../types/TreeNode";
import { For } from "solid-js";
import { ContextMenuState } from "../types/types";
import { getParentsPaths } from "../adapters/getParentsPath";

export function ContextView(props: {
  contextMenuState: ContextMenuState;
  close: () => void;
  adapterId?: AdapterId | undefined;
  targets: Targets;
  setHighlightedNode: (node: null | TreeNode) => void;
}) {
  let contentRef: HTMLDivElement | undefined;

  const paths = () =>
    getParentsPaths(props.contextMenuState.target, props.adapterId);

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
          <For each={paths()}>
            {(path) => {
              return <div>{path.title}</div>;
            }}
          </For>
          oh hello
        </div>
      </div>
    </div>
  );
}
