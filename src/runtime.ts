const dataByFilename: { [filename: string]: any } = {};
const baseColor = "#e90139";
const hoverColor = "#C70139";
const PADDING = 6;
let currentElementRef: null | WeakRef<HTMLElement> = null;
const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf('MAC')>=0;
const altTitle = isMac ? "Option" : "Alt";

if (typeof window !== "undefined") {
  document.addEventListener("keyup", globalKeyUpListener);
  const locatorDisabledCookie = getCookie("LOCATOR_DISABLED");
  let locatorDisabled = locatorDisabledCookie === "true";
  if (!locatorDisabled) {
    init(!locatorDisabledCookie);
  }
}

export function register(input: any) {
  dataByFilename[input.filePath] = input;
}

function buidLink(filePath: string, loc: any) {
  return `vscode://file${filePath}:${loc.start.line}:${loc.start.column + 1}`;
}

function rerenderLayer(found: HTMLElement, isAltKey: boolean) {
  const el = document.getElementById("locatorjs-layer");
  if (!el) {
    // in cases it's destroyed in the meantime
    return;
  }

  if (isAltKey) {
    document.body.style.cursor = "pointer";
  } else {
    document.body.style.cursor = "";
  }
  if (found.dataset && found.dataset.locatorjsId) {
    const [filePath, id] = found.dataset.locatorjsId.split("::");
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
      labelWrapper.id = "locatorjs-label-wrapper";
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
      label.id = "locatorjs-label";
      labelWrapper.appendChild(label);

      el.innerHTML = "";
      el.appendChild(rect);

      // document.body.childNodes = [rect]
    }
  }
}

function scrollListener() {
  // hide layers when scrolling
  const el = document.getElementById("locatorjs-layer");
  if (!el) {
    throw new Error("no layer found");
  }
  currentElementRef = null;
  el.innerHTML = "";
}

function mouseOverListener(e: MouseEvent) {
  const target = e.target;
  if (target && target instanceof HTMLElement) {
    if (
      target.id == "locatorjs-label" ||
      target.id == "locatorjs-label-wrapper"
    ) {
      return;
    }

    const found = target.closest("[data-locatorjs-id]");
    if (found && found instanceof HTMLElement) {
      currentElementRef = new WeakRef(found);
      rerenderLayer(found, e.altKey);
    }
  }
}

function keyDownListener(e: KeyboardEvent) {
  if (currentElementRef) {
    const el = currentElementRef.deref();
    if (el) {
      rerenderLayer(el, e.altKey);
    }
  }
}

function keyUpListener(e: KeyboardEvent) {
  if (currentElementRef) {
    const el = currentElementRef.deref();
    if (el) {
      rerenderLayer(el, e.altKey);
    }
  }
}

function globalKeyUpListener(e: KeyboardEvent) {
  if (e.code === "KeyD" && e.altKey) {
    const el = document.getElementById("locatorjs-layer");
    if (el) {
      destroy();
      setCookie("LOCATOR_DISABLED", "true");
    } else {
      init(false);
      setCookie("LOCATOR_DISABLED", "false");
    }
    return;
  }
}

function clickListener(e: MouseEvent) {
  if (!e.altKey) {
    return;
  }
  const target = e.target;
  if (target && target instanceof HTMLElement) {
    const found: HTMLElement | null = target.closest("[data-locatorjs-id]");
    if (!found || !found.dataset || !found.dataset.locatorjsId) {
      return;
    }
    const [filePath, id] = found.dataset.locatorjsId.split("::");
    const data = dataByFilename[filePath];
    console.log(data);
    console.log();
    const exp = data.expressions[Number(id)];
    // window.location.href =
    const link = buidLink(filePath, exp.loc);
    console.log(link);
    window.open(link);
    //   window.open(link, "_blank");
  }
}

function hideOnboardingHandler() {
  const onboardingEl = document.getElementById("locatorjs-onboarding");
  if (onboardingEl) {
    onboardingEl.remove();
  }
  setCookie("LOCATOR_DISABLED", "false");
}

function init(showOnboarding: boolean) {
  if (document.getElementById("locatorjs-layer")) {
    // already initialized
    return;
  }

  // add style tag to head
  const style = document.createElement("style");
  style.id = "locatorjs-style";
  style.innerHTML = `
        #locatorjs-label {
            cursor: pointer;
            background-color: ${baseColor};
        }
        #locatorjs-label:hover {
            background-color: ${hoverColor};
        }
        #locatorjs-onboarding-close {
            cursor: pointer;
            color: #baa;
        }
        #locatorjs-onboarding-close:hover {
            color: #fee
        }
    `;
  document.head.appendChild(style);

  document.addEventListener("scroll", scrollListener);
  document.addEventListener("mouseover", mouseOverListener, { capture: true });
  document.addEventListener("keydown", keyDownListener);
  document.addEventListener("keyup", keyUpListener);
  document.addEventListener("click", clickListener);

  // add layer to body
  const layer = document.createElement("div");
  layer.setAttribute("id", "locatorjs-layer");
  // layer is full screen
  layer.style.position = "fixed";
  layer.style.top = "0";
  layer.style.left = "0";
  layer.style.width = "100%";
  layer.style.height = "100%";
  layer.style.zIndex = "9999";
  layer.style.pointerEvents = "none";

  document.body.appendChild(layer);

  if (showOnboarding) {
    // add popover to the layer
    const modal = document.createElement("div");
    modal.setAttribute("id", "locatorjs-onboarding");
    modal.style.position = "absolute";
    modal.style.top = "18px";
    modal.style.left = "18px";
    // modal.style.width = "400px";
    modal.style.backgroundColor = "#333";
    modal.style.borderRadius = "12px";
    modal.style.fontSize = "14px";
    // modal.style.boxShadow = `1px 1px 6px ${baseColor}`;
    modal.style.border = "2px solid " + baseColor;
    modal.style.pointerEvents = "auto";
    modal.style.zIndex = "10000";
    modal.style.padding = "16px 20px";
    modal.style.color = "#fee";
    modal.style.lineHeight = "1.3rem";

    const modalHeader = document.createElement("div");
    modalHeader.style.padding = "0px";
    modalHeader.style.fontWeight = "bold";
    modalHeader.style.fontSize = "18px";
    modalHeader.style.marginBottom = "6px";
    
    modalHeader.textContent = "LocatorJS enabled";
    modal.appendChild(modalHeader);

    const modalBody = document.createElement("div");
    modalBody.style.padding = "0px";
    modalBody.innerHTML = `Disable/enable locator by <b>${altTitle}-d</b>`;
    modal.appendChild(modalBody);

    const note = document.createElement("div");
    note.style.padding = "0px";
    note.style.color = "#baa";
    note.innerHTML = `Hint: press and hold <b>${altTitle}</b> to make whole component box clickable.`;
    modal.appendChild(note);

    const closeButton = document.createElement("div");
    closeButton.id = "locatorjs-onboarding-close";
    closeButton.style.position = "absolute";
    closeButton.style.top = "10px";
    closeButton.style.right = "10px";
    closeButton.style.padding = "0px";
    closeButton.innerHTML = `<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>`;
    closeButton.addEventListener("click", hideOnboardingHandler)
    modal.appendChild(closeButton);
    

    document.body.appendChild(modal);
  }
}

function destroy() {
  const el = document.getElementById("locatorjs-layer");
  if (el) {
    document.removeEventListener("scroll", scrollListener);
    document.removeEventListener("mouseover", mouseOverListener, {
      capture: true,
    });
    document.removeEventListener("keydown", keyDownListener);
    document.removeEventListener("keyup", keyUpListener);
    document.removeEventListener("click", clickListener);

    el.remove();
  }
  const onboardingEl = document.getElementById("locatorjs-onboarding");
  if (onboardingEl) {
    onboardingEl.remove();
  }
  const styleEl = document.getElementById("locatorjs-style");
  if (styleEl) {
    styleEl.remove();
  }
  if (document.body.style.cursor === "pointer") {
    document.body.style.cursor = "";
  }
}

function getCookie(name: string) {
  var match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return match[2];
}

function setCookie(name: string, value: string) {
  document.cookie = name + "=" + (value || "") + "; path=/";
}
