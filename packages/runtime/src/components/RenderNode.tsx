import { createSignal, For } from "solid-js";
import { SimpleNode } from "../types/types";

export function RenderNode(props: {
  node: SimpleNode;
  parentIsHovered: boolean;
}) {
  const [isHovered, setIsHovered] = createSignal(false);

  const offset = () => (props.node.type === "component" ? 2 : 0);
  return (
    <div>
      {props.node.box ? (
        <div
          onMouseEnter={
            props.node.type === "component"
              ? () => setIsHovered(true)
              : undefined
          }
          onMouseLeave={
            props.node.type === "component"
              ? () => setIsHovered(false)
              : undefined
          }
          style={{
            position: "absolute",
            left: props.node.box.x - offset() + "px",
            top: props.node.box.y - offset() + "px",
            width: props.node.box.width + offset() * 2 + "px",
            height: props.node.box.height + offset() * 2 + "px",
            border:
              isHovered() || props.parentIsHovered
                ? props.node.type === "component"
                  ? "2px solid rgba(100,0,0,1)"
                  : "1px solid rgba(200,0,0,0.6)"
                : props.node.type === "component"
                ? "1px solid rgba(200,0,0,1)"
                : "1px solid rgba(200,0,0,0.1)",
            "border-radius": props.node.type === "component" ? "5px" : "3px",
            "z-index": props.node.type === "component" ? 1000 : 10,
          }}
        >
          {props.node.type === "component" || props.parentIsHovered ? (
            <div
              style={{
                padding: "1px 4px",
                background:
                  props.node.type === "component" ? "rgba(0,200,0,0.2)" : "",
                color:
                  props.node.type === "component"
                    ? "rgba(50,150,50,1)"
                    : "rgba(150,50,50,1)",
                position: "absolute",
                "font-size": "12px",
                "border-radius": "0px 0px 4px 4px",
                height: "20px",
                "white-space": "nowrap",
              }}
            >
              {props.node.name}
            </div>
          ) : null}
        </div>
      ) : null}
      {/* {props.node.type === "component" ? (
              <For each={props.node.children}>
                {(childNode, i) => {
                  if (
                    childNode.type === "element" &&
                    childNode.element instanceof HTMLElement &&
                    childNode.box
                  ) {
                    return (
                      <RenderNodeClone
                        element={childNode.element}
                        box={childNode.box}
                        isHovered={isHovered()}
                      />
                    );
                  }
      
                  return null;
                }}
              </For>
            ) : null} */}
      <For each={props.node.children}>
        {(childNode) => {
          return (
            <RenderNode
              node={childNode}
              parentIsHovered={
                isHovered() ||
                (props.node.type === "element" && props.parentIsHovered)
              }
            />
          );
        }}
      </For>
    </div>
  );
}
