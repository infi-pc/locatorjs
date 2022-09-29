import { Targets } from "@locator/shared";
import { createSignal, For } from "solid-js";
import { goToSource } from "../functions/goTo";
import { useOptions } from "../functions/optionsStore";
import { HighlightedNode, SimpleNode } from "../types/types";

export function TreeNode(props: {
  node: SimpleNode;
  idsToShow: {
    [id: string]: true;
  };
  idsThatHaveExpandedSuccessor: {
    [id: string]: true;
  };
  highlightedNode: HighlightedNode;
  targets: Targets;
}) {
  const options = useOptions();

  const [manuallyExpanded, setManuallyExpanded] = createSignal(false);
  function isExpanded() {
    return (
      manuallyExpanded() ||
      props.idsThatHaveExpandedSuccessor[props.node.uniqueId]
    );
  }
  function renderChildren() {
    return (
      <For each={props.node.children}>
        {(child) => (
          <TreeNode
            node={child}
            idsToShow={props.idsToShow}
            idsThatHaveExpandedSuccessor={props.idsThatHaveExpandedSuccessor}
            highlightedNode={props.highlightedNode}
            targets={props.targets}
          />
        )}
      </For>
    );
  }

  const isHighlighted = () =>
    props.highlightedNode.getNode()?.uniqueId === props.node.uniqueId;

  return (
    <div
      class="locatorjs-tree-node"
      style={{
        "padding-left": "1em",
        "font-size": "14px",
        "font-family": "monospace",
        "min-width": "300px",
        "pointer-events": "auto",
        cursor: "pointer",
        // display: "flex",
        // "flex-direction": "column",
      }}
    >
      <button
        onClick={() => {
          if (props.node.source) {
            goToSource(props.node.source, props.targets, options);
          }
        }}
        style={{
          "background-color": isHighlighted() ? "rgba(0,0,0,0.1)" : "white",
          color: props.idsToShow[props.node.uniqueId] ? "red" : "",
          border: props.idsThatHaveExpandedSuccessor[props.node.uniqueId]
            ? "1px solid red"
            : "1px solid black",
          "pointer-events": "auto",
          "text-decoration": props.node.source ? "underline" : "",
        }}
        // From some reason onMouseOver does not work in shadow dom
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        on:mouseover={(e) => {
          e.stopPropagation();
          props.highlightedNode.setNode(props.node);
        }}
      >
        {"<"}
        {props.node.name}
        {">"}
      </button>
      {isExpanded() ? (
        <>
          {props.node.type === "component" && props.node.source?.fileName ? (
            <div
              style={{
                border: "1px solid #ccc",
                padding: "0.5em",
                "min-width": "300px",
                // display: "flex",
                // "flex-direction": "column",
                background: isHighlighted() ? "rgba(0,0,0,0.1)" : "transparent",
              }}
              // From some reason onMouseOver does not work in shadow dom
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              on:mouseover={(e) => {
                e.stopPropagation();
                props.highlightedNode.setNode(props.node);
              }}
            >
              <div
                style={{
                  "font-size": "12px",
                  display: "flex",
                  "justify-content": "space-between",
                  "font-family": "Helvitica, sans-serif",
                }}
              >
                <div
                  style={{
                    "font-weight": "bold",
                  }}
                >
                  {props.node.name}:
                </div>{" "}
                <div
                  style={{
                    color: "#888",
                  }}
                >
                  {props.node.definitionSourceFile}
                </div>
              </div>
              {renderChildren()}
            </div>
          ) : (
            renderChildren()
          )}
        </>
      ) : props.node.children.length ? (
        <button
          onClick={() => {
            setManuallyExpanded(true);
          }}
        >
          ...
        </button>
      ) : null}
    </div>
  );
}
