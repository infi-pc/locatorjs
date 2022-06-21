function RenderNodeClone(props: {
  element: HTMLElement;
  box: DOMRect;
  isHovered: boolean;
}) {
  let myDiv: HTMLDivElement | undefined;

  return (
    <div
      style={{
        position: "absolute",
        left: props.box.left + "px",
        top: props.box.top + "px",
        width: props.box.width + "px",
        height: props.box.height + "px",
        "box-shadow":
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1), 0 25px 50px -12px rgb(0 0 0 / 0.25)",
        background: "rgba(255,255,255,1)",
        "border-radius": "5px",
        cursor: "pointer",
        overflow: "hidden",
      }}
      // eslint-disable-next-line react/no-unknown-property
      class="locator-cloned-element"
    >
      <div
        ref={myDiv}
        style={{
          "pointer-events": "none",
        }}
      ></div>
    </div>
  );
}
