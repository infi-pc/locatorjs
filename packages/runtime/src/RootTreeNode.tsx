import { SimpleNode } from "./types";
import { TreeNode } from "./TreeNode";

export function RootTreeNode(props: {
  node: SimpleNode;
  idsToShow: { [id: string]: true };
}) {
  function getIdsThatHaveExpandedSuccessor() {
    const idsThatHaveExpandedSuccessor: {
      [id: string]: true;
    } = {};

    function walkTree(node: SimpleNode): boolean {
      for (const child of node.children) {
        if (walkTree(child)) {
          idsThatHaveExpandedSuccessor[child.uniqueId] = true;
          return true;
        }
      }
      if (props.idsToShow[node.uniqueId]) {
        idsThatHaveExpandedSuccessor[node.uniqueId] = true;
        return true;
      }
      return false;
    }

    if (walkTree(props.node)) {
      idsThatHaveExpandedSuccessor[props.node.uniqueId] = true;
    }
    return idsThatHaveExpandedSuccessor;
  }

  return (
    <TreeNode
      node={props.node}
      idsToShow={props.idsToShow}
      idsThatHaveExpandedSuccessor={getIdsThatHaveExpandedSuccessor()}
    />
  );
}
