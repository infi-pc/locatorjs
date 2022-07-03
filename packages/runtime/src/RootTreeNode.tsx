import { SimpleNode } from "./types";
import { TreeNode } from "./TreeNode";
import { createMemo, createSignal } from "solid-js";
import { getIdsThatHaveExpandedSuccessor } from "./getIdsThatHaveExpandedSuccessor";

export type IdsMap = { [id: string]: true };

export function RootTreeNode(props: { node: SimpleNode; idsToShow: IdsMap }) {
  const idsThatHaveExpandedSuccessor = createMemo(() => {
    return getIdsThatHaveExpandedSuccessor(props.node, props.idsToShow);
  });

  const expandedNode = createMemo(() => {
    return findExpandedNode(
      props.node,
      props.idsToShow,
      idsThatHaveExpandedSuccessor()
    );
  });

  const [expanded, setExpanded] = createSignal(false);

  return (
    <>
      {expandedNode() &&
      expandedNode()?.uniqueId !== props.node.uniqueId &&
      !expanded() ? (
        <>
          <button
            onClick={() => {
              setExpanded(true);
            }}
          >
            ...
          </button>
          <TreeNode
            node={expandedNode()!}
            idsToShow={props.idsToShow}
            idsThatHaveExpandedSuccessor={idsThatHaveExpandedSuccessor()}
          />
        </>
      ) : (
        <>
          <button
            onClick={() => {
              setExpanded(false);
            }}
          >
            {"<<<"}
          </button>
          <TreeNode
            node={props.node}
            idsToShow={props.idsToShow}
            idsThatHaveExpandedSuccessor={idsThatHaveExpandedSuccessor()}
          />
        </>
      )}
    </>
  );
}

// walk the tree to find the closest node that is expanded
function findExpandedNode(
  node: SimpleNode,
  idsToShow: IdsMap,
  idsThatHaveExpandedSuccessor: IdsMap
): SimpleNode | undefined {
  if (idsToShow[node.uniqueId]) {
    return node;
  }
  let numOfChildrenWithExpandedSuccessor = 0;
  for (const child of node.children) {
    if (idsThatHaveExpandedSuccessor[child.uniqueId]) {
      numOfChildrenWithExpandedSuccessor++;
    }
  }
  if (numOfChildrenWithExpandedSuccessor >= 2) {
    return node;
  }

  for (const child of node.children) {
    const expandedNode = findExpandedNode(
      child,
      idsToShow,
      idsThatHaveExpandedSuccessor
    );
    if (expandedNode) {
      return expandedNode;
    }
  }

  return undefined;
}
