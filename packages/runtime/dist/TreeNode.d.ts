import { HighlightedNode, SimpleNode } from "./types";
export declare function TreeNode(props: {
    node: SimpleNode;
    idsToShow: {
        [id: string]: true;
    };
    idsThatHaveExpandedSuccessor: {
        [id: string]: true;
    };
    highlightedNode: HighlightedNode;
}): import("solid-js").JSX.Element;
