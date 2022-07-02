import { SimpleNode } from "./types";
export declare function TreeNode(props: {
    node: SimpleNode;
    idsToShow: {
        [id: string]: true;
    };
    idsThatHaveExpandedSuccessor: {
        [id: string]: true;
    };
}): import("solid-js").JSX.Element;
