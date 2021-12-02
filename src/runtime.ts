const dataByFilename: { [filename: string]: any } = {};
const baseColor = "#e90139";
const hoverColor = "#C70139";
const PADDING = 6;
// @ts-ignore
let currentElementRef: null | WeakRef<HTMLElement> = null;
const isMac =
  typeof navigator !== "undefined" &&
  navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const altTitle = isMac ? "Option" : "Alt";
const linkTemplates: { [k: string]: string } = {
  vscode: "vscode://file${filePath}:${line}:${column}",
  webstorm: "webstorm://open?file=${filePath}&line=${line}&column=${column}",
  // sublime: "sublimetext://open?url=file://${filePath}&line=${line}&column=${column}",
  atom: "atom://core/open/file?filename=${filePath}&line=${line}&column=${column}",
};

let linkTypeOrTemplate = getCookie("LOCATOR_CUSTOM_LINK") || "vscode";
let linkTemplate = linkTemplates[linkTypeOrTemplate] || linkTypeOrTemplate;

function setTemplate(lOrTemplate: string) {
  setCookie("LOCATOR_CUSTOM_LINK", lOrTemplate);
  linkTypeOrTemplate = lOrTemplate;
  linkTemplate = linkTemplates[linkTypeOrTemplate] || linkTypeOrTemplate;
}

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

function evalTemplate(str: string, params: { [key: string]: string }) {
  const names = Object.keys(params);
  const vals = Object.values(params);
  return new Function(...names, `return \`${str}\`;`)(...vals);
}

function buidLink(filePath: string, loc: any) {
  const params = {
    filePath,
    line: loc.start.line,
    column: loc.start.column + 1,
  };
  return evalTemplate(linkTemplate, params);
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
      // @ts-ignore
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
    console.log("TTT");
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
    e.preventDefault();
    e.stopPropagation();
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
        .locatorjs-options {
          display: flex;
          margin: 4px 0px;
        } 
        .locatorjs-option {
          cursor: pointer;
          padding: 4px 10px;
          margin-right: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
      .locatorjs-custom-template-input {
        background-color: transparent;
        border-radius: 6px;
        margin: 4px 0px;
        padding: 4px 10px;
        border: 1px solid #555;
        color: #fee;
        width: 400px;
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
    modalBody.innerHTML = `Disable/enable locator by <b>${altTitle}-d</b>`;
    modal.appendChild(modalBody);

    const note = document.createElement("div");
    note.style.color = "#baa";
    note.innerHTML = `Hint: press and hold <b>${altTitle}</b> to make whole component box clickable.`;
    modal.appendChild(note);

    const selector = document.createElement("div");
    // selector.style.padding = "0px";
    // selector.style.color = "#baa";
    selector.innerHTML = `
    <div class="locatorjs-options">
      <label class="locatorjs-option"><input type="radio" name="locatorjs-option" value="vscode" /> VSCode</label>
      <label class="locatorjs-option"><input type="radio" name="locatorjs-option" value="webstorm" /> Webstorm</label>
      <label class="locatorjs-option"><input type="radio" name="locatorjs-option" value="atom" /> Atom</label>
      <label class="locatorjs-option"><input type="radio" name="locatorjs-option" value="other" /> Other</label>
    </div>
    <input class="locatorjs-custom-template-input" type="text" value="${linkTemplate}" />
    `;
    modal.appendChild(selector);

    const input = modal.querySelector(
      ".locatorjs-custom-template-input"
    ) as HTMLInputElement;
    input.style.display = "none";

    // locatorjs-options should be clickable
    const options = modal.querySelectorAll(
      ".locatorjs-option input"
    ) as NodeListOf<HTMLInputElement>;
    options.forEach((option) => {
      if (linkTypeOrTemplate === option.value) {
        option.checked = true;
      }
      option.addEventListener("change", (e: any) => {
        if (e.target.checked) {
          if (e.target.value === "other") {
            input.style.display = "block";
            input.focus();
          } else {
            input.style.display = "none";
          }
          setTemplate(
            e.target.value === "other" ? input.value : e.target.value
          );
          input.value = linkTemplate;
        }
      });
    });

    const closeButton = document.createElement("div");
    closeButton.id = "locatorjs-onboarding-close";
    closeButton.style.position = "absolute";
    closeButton.style.top = "10px";
    closeButton.style.right = "10px";
    closeButton.style.padding = "0px";
    closeButton.innerHTML = `<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>`;
    closeButton.addEventListener("click", hideOnboardingHandler);
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
  if (typeof document === "undefined") {
    return;
  }
  var match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return match[2];
}

function setCookie(name: string, value: string) {
  document.cookie = name + "=" + (value || "") + "; path=/";
}
