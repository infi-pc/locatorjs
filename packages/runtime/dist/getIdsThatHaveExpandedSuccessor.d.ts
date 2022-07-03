import { SimpleNode } from "./types";
import { IdsMap } from "./RootTreeNode";
export declare function getIdsThatHaveExpandedSuccessor(node: SimpleNode, idsToShow: IdsMap): {
    [id: string]: true;
};
