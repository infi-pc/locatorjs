import { AllBoxes } from "./Outline";

export function RenderBoxes(props: { allBoxes: AllBoxes }) {
  return (
    <>
      {Object.entries(props.allBoxes.margin).map(([, box]) => {
        return (
          <div
            class="fixed flex text-xs font-bold items-center justify-center text-blue-500"
            style={{
              left: box.left + "px",
              top: box.top + "px",
              width: box.width + "px",
              height: box.height + "px",
              "background-color": "rgba(0, 181, 222, 0.1)",
              "text-shadow":
                "-1px 1px 0 #fff, 1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff",
            }}
          >
            {/* {box.label} */}
          </div>
        );
      })}
      {Object.entries(props.allBoxes.padding).map(([, box]) => {
        return (
          <div
            class="fixed flex text-xs font-bold items-center justify-center text-orange-500"
            style={{
              left: box.left + "px",
              top: box.top + "px",
              width: box.width + "px",
              height: box.height + "px",
              "background-color": "rgba(222, 148, 0, 0.3)",
              "text-shadow":
                "-1px 1px 0 #fff, 1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff",
            }}
          >
            {/* {box.label} */}
          </div>
        );
      })}

      <div
        class="fixed flex text-xs font-bold items-center justify-center text-sky-500"
        style={{
          left: props.allBoxes.innerBox.left + "px",
          top: props.allBoxes.innerBox.top + "px",
          width: props.allBoxes.innerBox.width + "px",
          height: props.allBoxes.innerBox.height + "px",
          "background-color": "rgba(0, 133, 222, 0.3)",
          "text-shadow":
            "-1px 1px 0 #fff, 1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff",
        }}
      >
        {props.allBoxes.innerBox.label}
      </div>
    </>
  );
}
