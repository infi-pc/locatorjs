import { Targets } from "@locator/shared";
import { createSignal, For } from "solid-js";
import { goToSource } from "../functions/goTo";
import { TreeNodeElement } from "../types/TreeNode";
import { HighlightedNode, SimpleNode } from "../types/types";

export function TreeNodeElementView(props: { node: TreeNodeElement }) {
  function renderChildren() {
    return (
      <For each={props.node.getChildren()}>
        {(child) => <TreeNodeElementView node={child as TreeNodeElement} />}
      </For>
    );
  }

  return <div>xxx</div>;
}
