import { Targets } from "@locator/shared";
import { TreePanel, visibleTreeRows, type TreeRow } from "@locator/ui";
import { computePosition, flip, offset, shift } from "@floating-ui/dom";
import { css } from "@locator/styled-system/css";
import { createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import { TreeState } from "../adapters/adapterApi";
import { useOptions } from "../functions/optionsStore";
import {
  buildTreeViewModel,
  sourceRefToLinkProps,
} from "../functions/treeViewModel";
import { TreeNode } from "../types/TreeNode";
import { LinkProps } from "../types/types";

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
  anchor: css({ m: "2", position: "absolute" }),
};

export function TreeView(props: {
  treeState: TreeState;
  setTreeState: (state: TreeState) => void;
  close: () => void;
  targets: Targets;
  setHighlightedNode: (node: null | TreeNode) => void;
  /** Opens the link, or asks the user to pick an editor first. */
  openLink: (link: LinkProps) => void;
}) {
  const options = useOptions();
  let contentRef: HTMLDivElement | undefined;

  const [pos, setPos] = createSignal<{ x: number; y: number }>();
  const [resolutionRevision, setResolutionRevision] = createSignal(0);
  const [pendingIds, setPendingIds] = createSignal<ReadonlySet<string>>(
    new Set()
  );
  const attemptedNodeIds = new Set<string>();
  const activeControllers = new Set<AbortController>();
  onCleanup(() => {
    activeControllers.forEach((controller) => controller.abort());
    activeControllers.clear();
  });

  createEffect(() => {
    if (!contentRef) return;
    const originalBox = props.treeState.originalNode.getBox();
    computePosition(
      {
        getBoundingClientRect: () =>
          ({
            top: originalBox?.y || 0,
            left: originalBox?.x || 0,
            width: 16,
            height: 16,
          } as DOMRect),
      },
      contentRef,
      {
        placement: "left-start",
        middleware: [offset(10), shift(), flip()],
      }
    ).then(({ x, y }) => setPos({ x, y }));
  });

  const model = createMemo(
    () => (
      resolutionRevision(),
      buildTreeViewModel(props.treeState, props.treeState.expandedIds)
    )
  );

  /** Nodes are keyed by id, so find the live node a row was mapped from. */
  function findNode(id: string): TreeNode | null {
    const nodeId = id.replace(/^component:/, "");
    const walk = (node: TreeNode): TreeNode | null => {
      if (node.uniqueId === nodeId) return node;
      for (const child of node.getChildren()) {
        const found = walk(child);
        if (found) return found;
      }
      return null;
    };
    return walk(props.treeState.root);
  }

  createEffect(() => {
    const visible = visibleTreeRows(model().rows, props.treeState.expandedIds);
    const nodes = [
      ...new Map(
        visible
          .filter(
            (item) =>
              !item.row.source &&
              !attemptedNodeIds.has(item.row.id.replace(/^component:/, ""))
          )
          .map((item) => {
            const node = findNode(item.row.id);
            return [node?.uniqueId, node] as const;
          })
          .filter(
            (entry): entry is readonly [string, TreeNode] =>
              !!entry[0] && !!entry[1]
          )
      ).values(),
    ];
    if (!nodes.some((node) => node.getSourceAsync || node.getComponentAsync)) {
      setPendingIds(new Set<string>());
      return;
    }
    nodes.forEach((node) => attemptedNodeIds.add(node.uniqueId));
    const controller = new AbortController();
    activeControllers.add(controller);
    setPendingIds(
      new Set(
        nodes.flatMap((node) => [node.uniqueId, `component:${node.uniqueId}`])
      )
    );
    void Promise.all(
      nodes.map(async (node) => {
        const context = {
          signal: controller.signal,
          deadline: Date.now() + 4_000,
        };
        await Promise.all([
          node.getSourceAsync?.(context),
          node.getComponentAsync?.(context),
        ]);
      })
    )
      .catch(() => undefined)
      .finally(() => {
        activeControllers.delete(controller);
        if (!controller.signal.aborted) {
          setPendingIds(new Set<string>());
          setResolutionRevision((value) => value + 1);
        }
      });
  });

  return (
    <div
      class={styles.backdrop}
      onClick={(e) => {
        if (e.currentTarget === e.target) props.close();
      }}
    >
      <div
        ref={contentRef}
        class={styles.anchor}
        style={{ top: `${pos()?.y || 0}px`, left: `${pos()?.x || 0}px` }}
      >
        <TreePanel
          model={model()}
          expandedIds={props.treeState.expandedIds}
          pendingIds={pendingIds()}
          autofocus
          hint={
            options.effective().debugMode
              ? "↑↓ move · ←→ collapse/expand · Enter opens · Esc closes"
              : undefined
          }
          onToggle={(id) => {
            const state = props.treeState;
            const expandedIds = new Set(state.expandedIds);
            const nodeId = id.replace(/^component:/, "");
            if (expandedIds.has(id)) {
              expandedIds.delete(id);
              expandedIds.delete(nodeId);
            } else {
              expandedIds.add(id);
              expandedIds.add(nodeId);
            }
            props.setTreeState({ ...state, expandedIds });
          }}
          onGoUp={() => {
            const state = props.treeState;
            const parent = state.root.getParent();
            if (!parent) return;
            const expandedIds = new Set(state.expandedIds);
            expandedIds.add(parent.uniqueId);
            expandedIds.add(`component:${parent.uniqueId}`);
            props.setTreeState({ ...state, root: parent, expandedIds });
          }}
          onHover={(id) => {
            props.setHighlightedNode(id ? findNode(id) : null);
          }}
          onOpen={(row: TreeRow) => {
            if (!row.source) return;
            props.setHighlightedNode(null);
            // The panel closes either way: the row has been acted on, and
            // leaving it up would put its backdrop over whatever comes next.
            props.openLink(sourceRefToLinkProps(row.source));
            props.close();
          }}
          onClose={() => {
            props.setHighlightedNode(null);
            props.close();
          }}
        />
      </div>
    </div>
  );
}
