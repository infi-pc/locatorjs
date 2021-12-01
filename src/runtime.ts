const dataByFilename: { [filename: string]: any } = {};

const baseColor = "#e90139"
const hoverColor = "#C70139"

export function register(input: any) {
  console.log(input);
  dataByFilename[input.filePath] = input;
}

function buidLink(filePath: string, loc: any) {
  return `vscode://file${filePath}:${loc.start.line}:${loc.start.column + 1}`;
}
const PADDING = 6;

function rerenderLayer(found: HTMLElement, isAltKey: boolean) {
  if (isAltKey) {
      document.body.style.cursor = 'pointer';
  } else {
      document.body.style.cursor = 'default';
  }
  if (found.dataset && found.dataset.visprId) {
    const [filePath, id] = found.dataset.visprId.split("::");
    const data = dataByFilename[filePath];
    const expData = data.expressions[id];
    if (expData) {
      const bbox = found.getBoundingClientRect();
      const rect = document.createElement("div");
      rect.style.position = "absolute";
      rect.style.left = bbox.x - PADDING + "px";
      rect.style.top = bbox.y - PADDING + "px";
      rect.style.width = bbox.width + PADDING * 2 + "px";
      rect.style.height = bbox.height + PADDING * 2 + "px";
      rect.style.border = "2px solid " + baseColor;
      rect.style.borderRadius = "8px";
      if (isAltKey) {
        rect.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
      }

      const topPart = document.createElement("div");
      topPart.style.position = "absolute";
      topPart.style.display = "flex";
      topPart.style.justifyContent = "center";
      topPart.style.top = "-30px";
      topPart.style.left = "0px";
      topPart.style.width = "100%";
      rect.appendChild(topPart);

      const labelWrapper = document.createElement("div");
      labelWrapper.style.padding = "2px 10px 10px 10px";
      // labelWrapper.style.backgroundColor = "#00ff00";
      labelWrapper.style.pointerEvents = "auto";
      labelWrapper.id = "vispr-label-wrapper";
      topPart.appendChild(labelWrapper);

      const label = document.createElement("a");
      label.href = buidLink(filePath, expData.loc);
      // label.style.backgroundColor = "#ff0000";
      label.style.color = "#fff";
      label.style.fontSize = "12px";
      label.style.fontWeight = "bold";
      label.style.textAlign = "center";
      label.style.padding = "2px 6px";
      label.style.borderRadius = "4px";
      label.style.fontFamily = "Helvetica, sans-serif, Arial";
      label.innerText = expData.name;
      label.id = "vispr-label";
      labelWrapper.appendChild(label);

      const el = document.getElementById("vispr-layer");
      if (!el) {
        throw new Error("no layer found");
      }
      el.innerHTML = "";
      el.appendChild(rect);

      // document.body.childNodes = [rect]
    }
  }
}

if (typeof window !== "undefined") {
  // add style tag to head
  const style = document.createElement("style");
  style.innerHTML = `
        #vispr-label {
            cursor: pointer;
            background-color: ${baseColor};
        }
        #vispr-label:hover {
            background-color: ${hoverColor};
        }
    `;
  document.head.appendChild(style);

  document.addEventListener("scroll", () => {
    // hide layers when scrolling
    const el = document.getElementById("vispr-layer");
    if (!el) {
      throw new Error("no layer found");
    }
    currentElementRef = null;
    el.innerHTML = "";
  });

  document.addEventListener(
    "mouseover",
    (e) => {
      const target = e.target;
      if (target && target instanceof HTMLElement) {
        if (target.id == "vispr-label" || target.id == "vispr-label-wrapper") {
          return;
        }

        const found = target.closest("[data-vispr-id]");
        if (found && found instanceof HTMLElement) {
          currentElementRef = new WeakRef(found);
          rerenderLayer(found, e.altKey);
        }
      }
    },
    { capture: true }
  );

  let currentElementRef: null | WeakRef<HTMLElement> = null;

  document.addEventListener("keydown", (e) => {
    if (currentElementRef) {
      const el = currentElementRef.deref();
      if (el) {
        rerenderLayer(el, e.altKey);
      }
    }
  });

  document.addEventListener("keyup", (e) => {
    if (currentElementRef) {
      const el = currentElementRef.deref();
      if (el) {
        rerenderLayer(el, e.altKey);
      }
    }
  });

  document.addEventListener("click", function (e) {
    if (!e.altKey) {
      return;
    }
    const target = e.target;
    if (target && target instanceof HTMLElement) {
      const found: HTMLElement | null = target.closest("[data-vispr-id]");
      if (!found || !found.dataset || !found.dataset.visprId) {
        return;
      }
      const [filePath, id] = found.dataset.visprId.split("::");
      const data = dataByFilename[filePath];
      console.log(data);
      console.log();
      const exp = data.expressions[Number(id)];
      // window.location.href =
      const link = buidLink(filePath, exp.loc);
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
