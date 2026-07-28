import { Targets } from "@locator/shared";
import { AdapterId } from "../consts";
import { TreeNode, TreeNodeElement } from "../types/TreeNode";
import { TreeState } from "../adapters/adapterApi";
import { TreeNodeElementView } from "./TreeNodeElementView";
import { createEffect, createSignal } from "solid-js";
import { computePosition, flip, shift, offset } from "@floating-ui/dom";
import { css } from "@locator/styled-system/css";
import { expandPill } from "@locator/styled-system/recipes";

const styles = {
  backdrop: css({
    bg: "black/10",
    height: "100vh",
    left: "0",
    pointerEvents: "auto",
    position: "fixed",
    top: "0",
    width: "100vw",
    zIndex: "popover",
  }),
  panel: css({
    bg: "bg.default",
    borderRadius: "l2",
    boxShadow: "xl",
    fontSize: "xs",
    m: "2",
    overflow: "auto",
    p: "4",
  }),
  parent: css({ mb: "2" }),
};

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
      class={styles.backdrop}
      style={{
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
          class={styles.panel}
          style={{
            "max-height": "calc(100vh - 16px)",
          }}
        >
          {props.treeState ? (
            <div>
              {props.treeState?.root.getParent() ? (
                <div class={styles.parent}>
                  <button
                    class={expandPill()}
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
