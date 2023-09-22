import { AllBoxes } from "./Outline";

export function RenderBoxes(props: { allBoxes: AllBoxes }) {
  return (
    <>
      {Object.entries(props.allBoxes.margin).map(([, box]) => {
        return (
          <div
            class="fixed flex text-xs font-bold items-center justify-center text-orange-500 bg-orange-500/30"
            style={{
              left: box.left + "px",
              top: box.top + "px",
              width: box.width + "px",
              height: box.height + "px",
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
            class="fixed flex text-xs font-bold items-center justify-center text-green-500 bg-green-500/30"
            style={{
              left: box.left + "px",
              top: box.top + "px",
              width: box.width + "px",
              height: box.height + "px",
              "text-shadow":
                "-1px 1px 0 #fff, 1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff",
            }}
          >
            {/* {box.label} */}
          </div>
        );
      })}

      <div
        class="fixed flex text-xs font-bold items-center justify-center text-blue-500 bg-blue-500/30"
        style={{
          left: props.allBoxes.innerBox.left + "px",
          top: props.allBoxes.innerBox.top + "px",
          width: props.allBoxes.innerBox.width + "px",
          height: props.allBoxes.innerBox.height + "px",

          "text-shadow":
            "-1px 1px 0 #fff, 1px 1px 0 #fff, 1px -1px 0 #fff, -1px -1px 0 #fff",
        }}
      >
        {props.allBoxes.innerBox.label}
      </div>
    </>
  );
}
