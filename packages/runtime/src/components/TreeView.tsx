import { Targets } from "@locator/shared";
import { AdapterId } from "../consts";
import { TreeNode, TreeNodeElement } from "../types/TreeNode";
import { TreeState } from "../adapters/adapterApi";
import { TreeNodeElementView } from "./TreeNodeElementView";
import { createEffect, createSignal } from "solid-js";
import { computePosition, flip, shift, offset } from "@floating-ui/dom";

export function TreeView(props: {
  treeState: TreeState;
  setTreeState: (state: TreeState) => void;
  close: () => void;
  adapterId?: AdapterId | undefined;
  targets: Targets;
  setHighlightedNode: (node: null | TreeNode) => void;
}) {
  let contentRef: HTMLDivElement | undefined;

  const [pos, setPos] = createSignal<{ x: number; y: number }>();
  createEffect(() => {
    if (contentRef) {
      const originalBox = props.treeState.originalNode.getBox();
      computePosition(
        {
          getBoundingClientRect: () => {
            return {
              top: originalBox?.y || 0,
              left: originalBox?.x || 0,
              width: 16,
              height: 16,
            } as DOMRect;
          },
        },
        contentRef,
        {
          placement: "left-start",
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
          {props.treeState ? (
            <div>
              {props.treeState?.root.getParent() ? (
                <div class="mb-2">
                  <button
                    class="inline-flex cursor-pointer bg-gray-100 rounded-full hover:bg-gray-200 py-0 px-2 "
                    onClick={() => {
                      const state = props.treeState;
                      const parent = state.root.getParent();
                      if (parent) {
                        state.expandedIds.add(parent.uniqueId);
                        props.setTreeState({ ...state, root: parent });
                      }
                    }}
                  >
                    ...
                  </button>
                </div>
              ) : null}
              <TreeNodeElementView
                node={props.treeState!.root as TreeNodeElement}
                expandedIds={props.treeState!.expandedIds}
                highlightedId={props.treeState!.highlightedId}
                expandId={(id: string) => {
                  const state = props.treeState;
                  state.expandedIds.add(id);
                  props.setTreeState(state);
                }}
                targets={props.targets}
                setHighlightedBoundingBox={props.setHighlightedNode}
                parentComponent={null}
              />
            </div>
          ) : (
            <>no tree</>
          )}
        </div>
      </div>
      {/* <For each={getAllNodes()}>
                {(node, i) => (
                  <RenderXrayNode node={node} parentIsHovered={false} />
                )}
              </For> */}
    </div>
  );
}
