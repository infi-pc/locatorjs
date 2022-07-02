/* eslint-disable react/no-unknown-property */
import { For } from "solid-js";
import { SimpleNode } from "./types";

export function TreeNode(props: {
  node: SimpleNode;
  idsToShow: {
    [id: string]: true;
  };
  idsThatHaveExpandedSuccessor: {
    [id: string]: true;
  };
}) {
  function isExpanded() {
    return props.idsThatHaveExpandedSuccessor[props.node.uniqueId];
  }
  function renderChildren() {
    return (
      <For each={props.node.children}>
        {(child, i) => (
          <TreeNode
            node={child}
            idsToShow={props.idsToShow}
            idsThatHaveExpandedSuccessor={props.idsThatHaveExpandedSuccessor}
          />
        )}
      </For>
    );
  }

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
        // TODO we should not need capture
        // @ts-ignore
        oncapture:click={() => {
          console.log(props.node.fiber);
        }}
        style={{
          "background-color": props.idsToShow[props.node.uniqueId]
            ? "yellow"
            : "",
          border: props.idsThatHaveExpandedSuccessor[props.node.uniqueId]
            ? "1px solid red"
            : "1px solid black",
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
                  {props.node.source?.fileName}
                </div>
              </div>
              {renderChildren()}
            </div>
          ) : (
            renderChildren()
          )}
        </>
      ) : (
        <button>...</button>
      )}
    </div>
  );
}
