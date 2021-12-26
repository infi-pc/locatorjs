type LocatorJSMode = "disabled" | "hidden" | "minimal" | "options";
const dataByFilename: { [filename: string]: any } = {};
const baseColor = "#e90139";
const hoverColor = "#C70139";
const PADDING = 6;
const fontFamily = "Helvetica, sans-serif, Arial";

// @ts-ignore
let currentElementRef: null | WeakRef<HTMLElement> = null;
const isMac =
  typeof navigator !== "undefined" &&
  navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const altTitle = isMac ? "Option" : "Alt";
type Target = {
  url: string;
  label: string;
};

type Targets = { [k: string]: Target };

let allTargets: Targets = {
  vscode: {
    url: "vscode://file${projectPath}${filePath}:${line}:${column}",
    label: "VSCode",
  },
  webstorm: {
    url: "webstorm://open?file=${projectPath}${filePath}&line=${line}&column=${column}",
    label: "WebStorm",
  },
  // sublime: { url: "sublimetext://open?url=file://${filePath}&line=${line}&column=${column}", label: ""},
  atom: {
    url: "atom://core/open/file?filename=${projectPath}${filePath}&line=${line}&column=${column}",
    label: "Atom",
  },
  // TODO nicer
  // github: { url: "https://www.github.com/infi-pc/locatorjs/web${filePath}:${line}:${column}", label: ""},
};

const repoLink = "https://github.com/infi-pc/locatorjs";
let linkTypeOrTemplate = getCookie("LOCATOR_CUSTOM_LINK") || "vscode";
let linkTemplate = allTargets[linkTypeOrTemplate]
let linkTemplateUrl: string = linkTemplate ? linkTemplate.url : linkTypeOrTemplate;
let locatorJSMode = getCookie("LOCATORJS") as LocatorJSMode | undefined;
let defaultMode: LocatorJSMode = "options";

function setMode(newMode: LocatorJSMode) {
  setCookie("LOCATORJS", newMode);
  locatorJSMode = newMode;
}

function setTemplate(lOrTemplate: string) {
  setCookie("LOCATOR_CUSTOM_LINK", lOrTemplate);
  linkTypeOrTemplate = lOrTemplate;
  const linkTemplate = allTargets[linkTypeOrTemplate]
  linkTemplateUrl = linkTemplate ? linkTemplate.url : linkTypeOrTemplate;
}

if (typeof window !== "undefined") {
  document.addEventListener("keyup", globalKeyUpListener);

  let locatorDisabled = locatorJSMode === "disabled";
  if (!locatorDisabled) {
    window.setTimeout(() => {
      // This should be done after all initial scripts are executed so setup had a chance to run
      init(locatorJSMode || defaultMode);
    }, 0);
  }
}

export function setup(props: {
  defaultMode?: LocatorJSMode;
  targets?: Targets;
}) {
  if (props.defaultMode) {
    defaultMode = props.defaultMode;
  }
  // TODO better structure
  if (props.targets) {
    allTargets = props.targets;
  }
  // TODO set
  // linkTemplates
}

export function register(input: any) {
  dataByFilename[input.projectPath + input.filePath] = input;
}

function evalTemplate(str: string, params: { [key: string]: string }) {
  const names = Object.keys(params);
  const vals = Object.values(params);
  // @ts-ignore
  return new Function(...names, `return \`${str}\`;`)(...vals);
}

function buidLink(filePath: string, projectPath: string, loc: any) {
  const params = {
    filePath,
    projectPath,
    line: loc.start.line,
    column: loc.start.column + 1,
  };
  return evalTemplate(linkTemplateUrl, params);
}

function rerenderLayer(found: HTMLElement, isAltKey: boolean) {
  const el = document.getElementById("locatorjs-layer");
  if (!el) {
    // in cases it's destroyed in the meantime
    return;
  }
  if (locatorJSMode === "hidden" && !isAltKey) {
    el.innerHTML = "";
    document.body.style.cursor = "";
    return;
  }

  if (isAltKey) {
    document.body.style.cursor = "pointer";
  } else {
    document.body.style.cursor = "";
  }
  if (found.dataset && found.dataset.locatorjsId) {
    const [fileFullPath, id] = parseDataId(found.dataset.locatorjsId);
    
    const fileData = dataByFilename[fileFullPath];
    const expData = fileData.expressions[id];
    if (expData) {
      const bbox = found.getBoundingClientRect();
      const rect = document.createElement("div");
      css(rect, {
        position: "absolute",
        left: bbox.x - PADDING + "px",
        top: bbox.y - PADDING + "px",
        width: bbox.width + PADDING * 2 + "px",
        height: bbox.height + PADDING * 2 + "px",
        border: "2px solid " + baseColor,
        borderRadius: "8px",
      });

      if (isAltKey) {
        rect.style.backgroundColor = "rgba(255, 0, 0, 0.1)";
      }
      const isReversed = bbox.y < 30;
      const topPart = document.createElement("div");
      topPart.style.position = "absolute";
      topPart.style.display = "flex";
      topPart.style.justifyContent = "center";
      if (isReversed) {
        topPart.style.bottom = "-26px";
      } else {
        topPart.style.top = "-30px";
      }

      topPart.style.left = "0px";
      topPart.style.width = "100%";
      rect.appendChild(topPart);

      const labelWrapper = document.createElement("div");
      labelWrapper.style.padding = isReversed
        ? "10px 10px 2px 10px"
        : "2px 10px 10px 10px";
      // labelWrapper.style.backgroundColor = "#00ff00";
      labelWrapper.style.pointerEvents = "auto";
      labelWrapper.id = "locatorjs-label-wrapper";
      topPart.appendChild(labelWrapper);

      const label = document.createElement("a");
      label.href = buidLink(
        fileData.filePath,
        fileData.projectPath,
        expData.loc
      );
      // label.style.backgroundColor = "#ff0000";
      css(label, {
        color: "#fff",
        fontSize: "12px",
        fontWeight: "bold",
        textAlign: "center",
        padding: "2px 6px",
        borderRadius: "4px",
        fontFamily: fontFamily,
        whiteSpace: "nowrap",
      });

      label.innerText =
        (expData.wrappingComponent ? `${expData.wrappingComponent}: ` : "") +
        expData.name;
      label.id = "locatorjs-label";
      labelWrapper.appendChild(label);

      el.innerHTML = "";
      el.appendChild(rect);
    }
  }
}

function parseDataId(dataId: string): [fileFullPath: string, id: string] {
  const [fileFullPath, id] = dataId.split("::");
  if (!fileFullPath || !id) {
    throw new Error("locatorjsId is malformed");
  }
  return [fileFullPath, id]
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
    if (locatorJSMode === "hidden") {
      destroy();
      setMode("minimal");
      init("minimal");
    } else {
      destroy();
      setMode("hidden");
      init("hidden");
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
    const [filePath, id] = parseDataId(found.dataset.locatorjsId);
    const fileData = dataByFilename[filePath];
    const expData = fileData.expressions[Number(id)];
    const link = buidLink(fileData.filePath, fileData.projectPath, expData.loc);
    e.preventDefault();
    e.stopPropagation();
    window.open(link);
    //   window.open(link, "_blank");
  }
}

function hideOptionsHandler() {
  hideOptions();
  setMode("minimal");
  showMinimal();
}

function showOptionsHandler() {
  hideMinimal();
  setMode("options");
  showOptions();
}

function hideOptions() {
  const optionsEl = document.getElementById("locatorjs-options");
  if (optionsEl) {
    optionsEl.remove();
  }
}

function init(locatorJSMode: LocatorJSMode) {
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
      #locatorjs-options-close {
          cursor: pointer;
          color: #baa;
      }
      #locatorjs-options-close:hover {
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
      #locatorjs-minimal-to-hide, #locatorjs-minimal-to-options {
        cursor: pointer;
      }
      #locatorjs-minimal-to-hide:hover, #locatorjs-minimal-to-options:hover {
        text-decoration: underline;
      }
    `;
  document.head.appendChild(style);

  document.addEventListener("scroll", scrollListener);
  document.addEventListener("mouseover", mouseOverListener, { capture: true });
  document.addEventListener("keydown", keyDownListener);
  document.addEventListener("keyup", keyUpListener);
  document.addEventListener("click", clickListener, { capture: true });

  // add layer to body
  const layer = document.createElement("div");
  layer.setAttribute("id", "locatorjs-layer");
  // layer is full screen
  css(layer, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    zIndex: "9999",
    pointerEvents: "none",
  });

  document.body.appendChild(layer);

  if (locatorJSMode === "minimal") {
    showMinimal();
  }
  if (locatorJSMode === "options") {
    showOptions();
  }
}

function showOptions() {
  const modal = document.createElement("div");
  modal.setAttribute("id", "locatorjs-options");
  css(modal, {
    position: "fixed",
    bottom: "18px",
    left: "18px",
    backgroundColor: "#333",
    borderRadius: "12px",
    fontSize: "14px",
    border: "2px solid " + baseColor,
    pointerEvents: "auto",
    zIndex: "10000",
    padding: "16px 20px",
    color: "#fee",
    lineHeight: "1.3rem",
    fontFamily,
  });

  const modalHeader = document.createElement("div");
  css(modalHeader, {
    padding: "0px",
    fontWeight: "bold",
    fontSize: "18px",
    marginBottom: "6px",
  });

  modalHeader.innerHTML = `<a href="${repoLink}">LocatorJS enabled</a>`;
  modal.appendChild(modalHeader);

  const controls = document.createElement("div");
  controls.style.color = "#baa";
  controls.innerHTML = `<div><b>${altTitle}+d:</b> enable/disable Locator<br /><b>Press and hold ${altTitle}:</b> make boxes clickable on full surface </div>`;
  modal.appendChild(controls);

  const selector = document.createElement("div");
  selector.style.marginTop = "10px";

  // TODO print targets from their definition object
  selector.innerHTML = `
    <b>Choose your editor: </b>
    <div class="locatorjs-options">
      ${Object.entries(allTargets).map(([key, target]) => {
        return `<label class="locatorjs-option"><input type="radio" name="locatorjs-option" value="${key}" /> ${target.label}</label>`;
      })}
      <label class="locatorjs-option"><input type="radio" name="locatorjs-option" value="other" /> Other</label>
    </div>
    <input class="locatorjs-custom-template-input" type="text" value="${linkTemplateUrl}" />
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
        setTemplate(e.target.value === "other" ? input.value : e.target.value);
        input.value = linkTemplateUrl;
      }
    });
  });

  const closeButton = document.createElement("div");
  closeButton.id = "locatorjs-options-close";
  css(closeButton, {
    position: "absolute",
    top: "10px",
    right: "10px",
    padding: "0px",
  });
  closeButton.innerHTML = `<svg style="width:24px;height:24px" viewBox="0 0 24 24"><path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg>`;
  closeButton.addEventListener("click", hideOptionsHandler);
  modal.appendChild(closeButton);

  document.body.appendChild(modal);
}

function showMinimal() {
  const minimal = document.createElement("div");
  minimal.setAttribute("id", "locatorjs-minimal");
  css(minimal, {
    position: "fixed",
    bottom: "18px",
    left: "18px",
    backgroundColor: baseColor,
    fontSize: "14px",
    borderRadius: "4px",
    padding: "2px 6px",
    color: "white",
    zIndex: "10000",
    fontFamily,
  });
  minimal.innerHTML = `
    <div><a href="${repoLink}">LocatorJS</a>: <a id="locatorjs-minimal-to-options">options</a> | <a id="locatorjs-minimal-to-hide">hide</a></div>
    `;

  const options = minimal.querySelector(
    "#locatorjs-minimal-to-options"
  ) as HTMLInputElement;
  options.addEventListener("click", showOptionsHandler);

  const hide = minimal.querySelector(
    "#locatorjs-minimal-to-hide"
  ) as HTMLInputElement;
  hide.addEventListener("click", goToHiddenHandler);

  document.body.appendChild(minimal);
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
  hideOptions();
  const styleEl = document.getElementById("locatorjs-style");
  if (styleEl) {
    styleEl.remove();
  }
  hideMinimal();
  if (document.body.style.cursor === "pointer") {
    document.body.style.cursor = "";
  }
}

function hideMinimal() {
  const minimalEl = document.getElementById("locatorjs-minimal");
  if (minimalEl) {
    minimalEl.remove();
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

function css(element: HTMLElement, styles: Partial<CSSStyleDeclaration>) {
  for (const key of Object.keys(styles)) {
    // @ts-ignore
    element.style[key] = styles[key];
  }
}
function goToHiddenHandler() {
  setMode("hidden");
  destroy();
  init("hidden");
  alert(
    `LocatorJS will be now hidden.\n\nPress and hold ${altTitle} so start selecting in hidden mode.\n${altTitle}+d: To show UI`
  );
}
