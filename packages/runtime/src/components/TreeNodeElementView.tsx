import { createSignal, For } from "solid-js";
import { TreeNodeElement } from "../types/TreeNode";

export function TreeNodeElementView(props: {
  node: TreeNodeElement;
  expandedIds: Set<string>;
  highlightedId: string;
  expandId: (id: string) => void;
}) {
  function renderChildren() {
    return (
      <For each={props.node.getChildren()}>
        {(child) => (
          <TreeNodeElementView
            node={child as TreeNodeElement}
            expandedIds={props.expandedIds}
            highlightedId={props.highlightedId}
            expandId={props.expandId}
          />
        )}
      </For>
    );
  }

  return (
    <div
      class={
        "text-sm p-2 border border-gray-200 " +
        (props.highlightedId === props.node.uniqueId ? "bg-yellow-100" : "")
      }
    >
      <div>{props.node.name}</div>
      <div>
        {props.expandedIds.has(props.node.uniqueId) ? (
          renderChildren()
        ) : props.node.getChildren().length ? (
          <button
            class="inline-flex cursor-pointer bg-gray-100 rounded-full hover:bg-gray-200 py-0 px-2"
            onClick={() => {
              props.expandId(props.node.uniqueId);
            }}
          >
            ...
          </button>
        ) : (
          ""
        )}
      </div>
    </div>
  );
}
