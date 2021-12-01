const dataByFilename: { [filename: string]: any } = {};

export function register(input: any) {
  console.log(input);
  dataByFilename[input.filePath] = input;
}

const PADDING = 6

if (typeof window !== "undefined") {
  // add style tag to head
//   const style = document.createElement("style");
//   style.innerHTML = `
//         [data-vispr-id]:hover {
//             outline: 1px solid red;
//         }
//     `;
//   document.head.appendChild(style);

  document.addEventListener(
    "mouseover",
    function (e) {
      if (e.target) {
        // @ts-ignore
        const found = e.target.closest("[data-vispr-id]");
        // add bouding box to the layer

        if (found) {
          const [filePath, id] = found.dataset.visprId.split("::");
          const data = dataByFilename[filePath];

          if (data) {
            const bbox = found.getBoundingClientRect();
            const rect = document.createElement("div");
            rect.style.position = "absolute";
            rect.style.left = bbox.x - PADDING + "px";
            rect.style.top = bbox.y - PADDING + "px";
            rect.style.width = (bbox.width + PADDING * 2) + "px";
            rect.style.height = (bbox.height + PADDING * 2) + "px";
            rect.style.border = "2px solid #ff0000";
            rect.style.borderRadius = "8px";
            const el = document.getElementById("vispr-layer")
            if (!el) {
                throw new Error("no layer found")
            }
            el.innerHTML = "";
            el.appendChild(rect);
            
            // document.body.childNodes = [rect]
          }
        }
      }
    },
    { capture: true }
  );

  document.addEventListener("click", function (e) {
    if (e.target) {
      // @ts-ignore
      const found = e.target.closest("[data-vispr-id]");
      console.log(found);
      const [filePath, id] = found.dataset.visprId.split("::");
      const data = dataByFilename[filePath];
      console.log(data);
      console.log();
      const exp = data.expressions[Number(id)];
      // window.location.href =
      const link = `vscode://file${filePath}:${exp.loc.start.line}:${
        exp.loc.start.column + 1
      }`;
      console.log(link);
      var win = window.open(link, "_blank");
    }
  });

  // add layer to body
  const layer = document.createElement("div");
  layer.setAttribute("id", "vispr-layer");
  // layer is full screen
  layer.style.position = "fixed";
  layer.style.top = "0";
  layer.style.left = "0";
  layer.style.width = "100%";
  layer.style.height = "100%";
  layer.style.zIndex = "9999";
  layer.style.pointerEvents = "none";
  document.body.appendChild(layer);
}
