import { Targets } from "@locator/shared";
import { createSignal, For } from "solid-js";
import { goToSource } from "../functions/goTo";
import { TreeNodeElement } from "../types/TreeNode";

export function TreeNodeElementView(props: {
  node: TreeNodeElement;
  expandedIds: Set<string>;
  highlightedId: string;
  expandId: (id: string) => void;
  parentFilePath?: string;
  targets: Targets;
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
            parentFilePath={props.node.getSource()?.fileName}
            targets={props.targets}
          />
        )}
      </For>
    );
  }

  function isDifferentFilePath() {
    return props.node.getSource()?.fileName !== props.parentFilePath;
  }
  return (
    <div
      class={
        "text-xs pl-2 " +
        (props.highlightedId === props.node.uniqueId ? "bg-yellow-100 " : " ") +
        (isDifferentFilePath() ? "border border-gray-300 py-2 pr-2 " : " ") +
        (props.node.getSource() ? "text-black " : "text-gray-500 ")
      }
    >
      <div
        class={
          "flex justify-between items-center " +
          (props.node.getSource() ? " cursor-pointer hover:bg-sky-100" : "")
        }
        onClick={() => {
          const source = props.node.getSource();
          if (source) {
            goToSource(source, props.targets);
          }
        }}
      >
        <div class="font-mono">
          {"<"}
          {props.node.name}
          {">"}
        </div>
        <div>
          {isDifferentFilePath() ? props.node.getSource()?.fileName : null}
        </div>
      </div>

      <div>
        {props.expandedIds.has(props.node.uniqueId) ? (
          renderChildren()
        ) : props.node.getChildren().length ? (
          <button
            class="inline-flex cursor-pointer bg-gray-100 rounded-full hover:bg-gray-200 py-0 px-2 ml-2"
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
