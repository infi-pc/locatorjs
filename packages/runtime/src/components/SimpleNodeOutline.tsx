import { TreeNode } from "../types/TreeNode";

export function SimpleNodeOutline(props: { node: TreeNode }) {
  const offset = () => (props.node.type === "component" ? 2 : 0);
  const box = () => props.node.getBox();
  return (
    <div>
      {box() ? (
        <div
          style={{
            position: "fixed",
            left: box()!.x - offset() + "px",
            top: box()!.y - offset() + "px",
            width: box()!.width + offset() * 2 + "px",
            height: box()!.height + offset() * 2 + "px",
            border:
              props.node.type === "component"
                ? "2px solid rgba(200,0,0,1)"
                : "1px solid rgba(200,0,0,1)",
            "border-radius": props.node.type === "component" ? "5px" : "3px",
            "z-index": props.node.type === "component" ? 1000 : 10,
          }}
        />
      ) : null}
    </div>
  );
}
