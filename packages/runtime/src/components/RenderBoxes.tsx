import { AllBoxes } from "./Outline";
import { css } from "@locator/styled-system/css";

const boxBase = {
  alignItems: "center",
  display: "flex",
  fontSize: "xs",
  fontWeight: "bold",
  justifyContent: "center",
  position: "fixed",
} as const;

const styles = {
  margin: css({
    ...boxBase,
    bg: "amber.9/30",
    color: "amber.9",
  }),
  padding: css({
    ...boxBase,
    bg: "violet.9/30",
    color: "violet.9",
  }),
  inner: css({
    ...boxBase,
    bg: "blue.9/30",
    color: "blue.9",
  }),
};

export function RenderBoxes(props: { allBoxes: AllBoxes }) {
  return (
    <>
      {Object.entries(props.allBoxes.margin).map(([, box]) => {
        return (
          <div
            class={styles.margin}
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
            class={styles.padding}
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
        class={styles.inner}
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
