import { SimpleNode } from "./types";

export function SimpleNodeOutline(props: { node: SimpleNode }) {
  const offset = props.node.type === "component" ? 2 : 0;
  return (
    <div>
      {props.node.box ? (
        <div
          style={{
            position: "absolute",
            left: props.node.box.x - offset + "px",
            top: props.node.box.y - offset + "px",
            width: props.node.box.width + offset * 2 + "px",
            height: props.node.box.height + offset * 2 + "px",
            border:
              props.node.type === "component"
                ? "2px solid rgba(200,0,0,1)"
                : "1px solid rgba(200,0,0,1)",
            "border-radius": props.node.type === "component" ? "5px" : "3px",
            "z-index": props.node.type === "component" ? 1000 : 10,
          }}
        ></div>
      ) : null}
    </div>
  );
}
