import { Targets } from "@locator/shared";
import { For } from "solid-js";
import cropPath from "../functions/cropPath";
import { goToSource } from "../functions/goTo";
import { useOptions } from "../functions/optionsStore";
import { TreeNodeComponent, TreeNodeElement } from "../types/TreeNode";

export function TreeNodeElementView(props: {
  node: TreeNodeElement;
  expandedIds: Set<string>;
  highlightedId: string;
  expandId: (id: string) => void;
  parentFilePath?: string;
  parentComponent: TreeNodeComponent | null;
  targets: Targets;
  setHighlightedBoundingBox: (node: TreeNodeElement | null) => void;
}) {
  const options = useOptions();

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
            setHighlightedBoundingBox={props.setHighlightedBoundingBox}
            parentComponent={props.node.getComponent()}
          />
        )}
      </For>
    );
  }

  function isDifferentFilePath() {
    return props.node.getSource()?.fileName !== props.parentFilePath;
  }

  function isDifferentComponent() {
    return (
      props.node.getComponent &&
      JSON.stringify(props.node.getComponent()) !==
        JSON.stringify(props.parentComponent)
    );
  }

  // Assume that library components does not have a source, so show them inlined
  const preferInlineComponent = () => !props.node.getSource();

  function showComponentWrapper() {
    return isDifferentComponent() && !preferInlineComponent();
  }

  function showBorder() {
    return showComponentWrapper();
  }

  function componentLink() {
    return props.node.getComponent()?.callLink ? (
      <div
        class="font-bold cursor-pointer text-black hover:bg-gray-100 rounded"
        onClick={() => {
          const callLink = props.node.getComponent()?.callLink;
          if (callLink) {
            goToSource(callLink, props.targets, options);
          }
        }}
      >
        {props.node.getComponent()?.label}
      </div>
    ) : (
      <div class="font-bold">{props.node.getComponent()?.label}</div>
    );
  }
  return (
    <div
      class={
        "text-xs pl-2 " +
        (props.highlightedId === props.node.uniqueId ? "bg-yellow-100 " : " ") +
        (showBorder() ? "border border-gray-300 py-2 pr-2 " : " ") +
        (props.node.getSource() ? "text-black " : "text-gray-500 ")
      }
      onMouseEnter={() => {
        props.setHighlightedBoundingBox(props.node);
      }}
      onMouseLeave={() => {
        props.setHighlightedBoundingBox(null);
      }}
    >
      {showComponentWrapper() && (
        <div class="flex gap-2 justify-between pb-1">
          {componentLink()}
          <div class="whitespace-nowrap text-ellipsis overflow-hidden">
            {cropPath(
              props.node.getComponent()?.definitionLink?.fileName || ""
            )}
          </div>
        </div>
      )}
      <div class={showComponentWrapper() ? "pl-2" : ""}>
        <div
          class={
            "flex justify-between items-center gap-4 " +
            (props.node.getSource() ? " cursor-pointer hover:bg-sky-100" : "")
          }
          onClick={() => {
            const source = props.node.getSource();
            if (source) {
              goToSource(source, props.targets, options);
            }
          }}
        >
          <div class="font-mono flex gap-1">
            {"<"}
            {props.node.name}
            {">"}

            {preferInlineComponent() && componentLink()}
          </div>
          <div class="whitespace-nowrap text-ellipsis overflow-hidden">
            {isDifferentFilePath() && !showComponentWrapper()
              ? cropPath(props.node.getSource()?.fileName || "")
              : null}
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
    </div>
  );
}
