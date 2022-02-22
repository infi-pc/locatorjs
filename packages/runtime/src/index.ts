type LocatorJSMode = "disabled" | "hidden" | "minimal" | "options";

type SourceLocation = {
  start: {
    line: number;
    column: number;
  };
  end: {
    line: number;
    column: number;
  };
};

type ExpressionInfo =
  | {
      type: "jsx";
      name: string;
      wrappingComponent: string | null;
      loc: SourceLocation | null;
    }
  | {
      type: "styledComponent";
      name: string | null;
      loc: SourceLocation | null;
      htmlTag: string | null;
    };

type FileStorage = {
  filePath: string;
  projectPath: string;
  nextId: number;
  expressions: ExpressionInfo[];
};

const dataByFilename: { [filename: string]: FileStorage } = {};
const baseColor = "#e90139";
const hoverColor = "#C70139";
const linkColor = "rgb(56 189 248)";
const linkColorHover = "rgb(125 211 252)";

const PADDING = 6;
const fontFamily = "Helvetica, sans-serif, Arial";

// @ts-ignore
let currentElementRef: null | WeakRef<HTMLElement> = null;
const isMac =
  typeof navigator !== "undefined" &&
  navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const altTitle = isMac ? "⌥ Option" : "Alt";
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
  atom: {
    url: "atom://core/open/file?filename=${projectPath}${filePath}&line=${line}&column=${column}",
    label: "Atom",
  },
};

const repoLink = "https://github.com/infi-pc/locatorjs";
let linkTypeOrTemplate = getCookie("LOCATOR_CUSTOM_LINK") || "vscode";
let linkTemplate = () => allTargets[linkTypeOrTemplate];
let linkTemplateUrl = (): string => {
  const l = linkTemplate();
  return l ? l.url : linkTypeOrTemplate;
};

let modeInCookies = getCookie("LOCATORJS") as LocatorJSMode | undefined;
let defaultMode: LocatorJSMode = "options";

function getMode() {
  return modeInCookies || defaultMode;
}

function setMode(newMode: LocatorJSMode) {
  setCookie("LOCATORJS", newMode);
  modeInCookies = newMode;
}

function setTemplate(lOrTemplate: string) {
  setCookie("LOCATOR_CUSTOM_LINK", lOrTemplate);
  linkTypeOrTemplate = lOrTemplate;
}

if (typeof window !== "undefined") {
  document.addEventListener("keyup", globalKeyUpListener);

  let locatorDisabled = getMode() === "disabled";
  if (!locatorDisabled) {
    window.addEventListener("load", function () {
      init(getMode());
    });
  }
}

export function setup(props: {
  defaultMode?: LocatorJSMode;
  targets?: { [k: string]: Target | string };
}) {
  if (props.defaultMode) {
    defaultMode = props.defaultMode;
  }
  if (props.targets) {
    allTargets = Object.fromEntries(
      Object.entries(props.targets).map(([key, target]) =>
        typeof target === "string"
          ? [key, { url: target, label: key }]
          : [key, target]
      )
    );
    const firstKey = Object.keys(allTargets)[0];
    if (!firstKey) {
      throw new Error("no targets found");
    }
    linkTypeOrTemplate = firstKey;
  }
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
  return evalTemplate(linkTemplateUrl(), params);
}

function rerenderLayer(found: HTMLElement, isAltKey: boolean) {
  const el = document.getElementById("locatorjs-layer");
  if (!el) {
    // in cases it's destroyed in the meantime
    return;
  }
  if (getMode() === "hidden" && !isAltKey) {
    el.innerHTML = "";
    document.body.style.cursor = "";
    return;
  }

  if (isAltKey) {
    document.body.style.cursor = "pointer";
  } else {
    document.body.style.cursor = "";
  }
  if (
    found.dataset &&
    (found.dataset.locatorjsId || found.dataset.locatorjsStyled)
  ) {
    const labels = [
      found.dataset.locatorjsId
        ? getDataForDataId(found.dataset.locatorjsId)
        : null,
      found.dataset.locatorjsStyled
        ? getDataForDataId(found.dataset.locatorjsStyled)
        : null,
    ].filter(nonNullable);

    if (labels.length === 0) {
      return;
    }

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
    const labelsSection = document.createElement("div");
    labelsSection.id = "locatorjs-labels-section";
    labelsSection.style.position = "absolute";
    labelsSection.style.display = "flex";
    labelsSection.style.justifyContent = "center";
    if (isReversed) {
      labelsSection.style.bottom = "-28px";
    } else {
      labelsSection.style.top = "-28px";
    }

    labelsSection.style.left = "0px";
    labelsSection.style.width = "100%";
    // Uncomment when need to debug
    // labelsSection.style.backgroundColor = "rgba(0, 255, 0, 0.5)";
    labelsSection.style.pointerEvents = "auto";
    if (isReversed) {
      labelsSection.style.borderBottomLeftRadius = "100%";
      labelsSection.style.borderBottomRightRadius = "100%";
    } else {
      labelsSection.style.borderTopLeftRadius = "100%";
      labelsSection.style.borderTopRightRadius = "100%";
    }

    rect.appendChild(labelsSection);

    const labelWrapper = document.createElement("div");
    labelWrapper.id = "locatorjs-labels-wrapper";
    labelWrapper.style.padding = isReversed
      ? "10px 10px 2px 10px"
      : "2px 10px 10px 10px";

    labelsSection.appendChild(labelWrapper);

    labels.forEach(({ fileData, expData }) => {
      const label = document.createElement("a");
      label.className = "locatorjs-label";
      label.href = buidLink(
        fileData.filePath,
        fileData.projectPath,
        expData.loc
      );
      if (expData.type === "jsx") {
        label.innerText =
          (expData.wrappingComponent ? `${expData.wrappingComponent}: ` : "") +
          expData.name;
      } else {
        label.innerText = `${
          expData.htmlTag ? `styled.${expData.htmlTag}` : "styled"
        }${expData.name ? `: ${expData.name}` : ""}`;
      }
      label.onclick = (e) => {
        const link = buidLink(
          fileData.filePath,
          fileData.projectPath,
          expData.loc
        );
        window.open(link);
      };

      labelWrapper.appendChild(label);
    });

    el.innerHTML = "";
    el.appendChild(rect);
  }
}

function parseDataId(dataId: string): [fileFullPath: string, id: string] {
  const [fileFullPath, id] = dataId.split("::");
  if (!fileFullPath || !id) {
    throw new Error("locatorjsId is malformed");
  }
  return [fileFullPath, id];
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
      target.className == "locatorjs-label" ||
      target.id == "locatorjs-labels-section"
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
    if (getMode() === "hidden") {
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
    if (!fileData) {
      return;
    }
    const expData = fileData.expressions[Number(id)];
    if (!expData) {
      return;
    }
    const link = buidLink(fileData.filePath, fileData.projectPath, expData.loc);
    e.preventDefault();
    e.stopPropagation();
    window.open(link);
    //   window.open(link, "_blank");
  }
}

// function hideOptionsHandler() {
//   hideOptions();
//   setMode("hidden");
//   // showMinimal();
// }

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

function init(mode: LocatorJSMode) {
  if (document.getElementById("locatorjs-layer")) {
    // already initialized
    return;
  }

  // add style tag to head
  const style = document.createElement("style");
  style.id = "locatorjs-style";
  style.innerHTML = `
      #locatorjs-layer * {
        box-sizing: border-box;
      }
      .locatorjs-label {
        cursor: pointer;
        background-color: ${baseColor};
        display: block;
        color: #fff;
        font-size: 12px;
        font-weight: bold;
        text-align: center;
        padding: 2px 6px;
        border-radius: 4px;
        font-family: ${fontFamily};
        white-space: nowrap;
        text-decoration: none !important;
        line-height: 18px;
      }
      .locatorjs-label:hover {
        background-color: ${hoverColor};
        color: #fff;
        text-decoration: none;
      }
      #locatorjs-labels-section {
      }
      #locatorjs-labels-wrapper {
        display: flex;
        gap: 8px;
      }
      #locatorjs-options {
        max-width: 100vw;
        position: fixed;
        bottom: 18px;
        left: 18px;
        background-color: #333;
        border-radius: 12px;
        font-size: 14px;
        pointer-events: auto;
        z-index: 100000;
        padding: 16px 20px;
        color: #eee;
        line-height: 1.3em;
        font-family: ${fontFamily};
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      }
      #locatorjs-options a {
        color: ${linkColor};
        text-decoration: underline;
      }
      #locatorjs-options a:hover {
        color: ${linkColorHover};
        text-decoration: underline;
      }
      #locatorjs-minimal a {
        color: #fff;
        text-decoration: none;
      }
      #locatorjs-minimal a:hover {
        color: #ccc;
        text-decoration: none;
      }
      #locatorjs-options-close {
        cursor: pointer;
        color: #aaa;
      }
      #locatorjs-options-close:hover {
          color: #eee
      }
      #locatorjs-options .locatorjs-editors-options {
        display: flex;
        margin: 4px 0px;
      } 
      #locatorjs-options .locatorjs-option {
        cursor: pointer;
        padding: 4px 10px;
        margin-right: 4px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      #locatorjs-options .locatorjs-custom-template-input {
        background-color: transparent;
        border-radius: 6px;
        margin: 4px 0px;
        padding: 4px 10px;
        border: 1px solid #555;
        color: #eee;
        width: 400px;
      }
      #locatorjs-minimal-to-hide, #locatorjs-minimal-to-options {
        cursor: pointer;
      }
      #locatorjs-minimal-to-hide:hover, #locatorjs-minimal-to-options:hover {
        text-decoration: underline;
      }
      #locatorjs-options .locatorjs-key {
        padding: 2px 4px;
        border-radius: 4px;
        border: 1px solid #555;
        margin: 2px;
      }
      #locatorjs-options .locatorjs-line {
        padding: 4px 0px;
      }
      @media (max-width: 600px) {
        #locatorjs-options {
          width: 100vw;
          bottom: 0px;
          left: 0px;
          border-radius: 12px 12px 0px 0px;
        }
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

  if (mode === "minimal") {
    showMinimal();
  }
  if (mode === "options") {
    showOptions();
  }
}

function showOptions() {
  const modal = document.createElement("div");
  modal.setAttribute("id", "locatorjs-options");

  const modalHeader = document.createElement("div");
  css(modalHeader, {
    padding: "0px",
    fontWeight: "bold",
    fontSize: "18px",
    marginBottom: "6px",
  });

  modalHeader.innerHTML = `LocatorJS enabled`;
  modal.appendChild(modalHeader);

  const controls = document.createElement("div");
  controls.style.color = "#aaa";
  controls.innerHTML = `
    <div>
      <div class="locatorjs-line"><b>Press and hold <span class="locatorjs-key">${altTitle}</span>:</b> make boxes clickable on full surface</div>
      <div class="locatorjs-line"><b><span class="locatorjs-key">${altTitle}</span> + <span class="locatorjs-key">D</span>:</b> hide/show LocatorJS panel</div>
      <div class="locatorjs-line">
        <a href="${repoLink}">more info</a>
      </div>
    </div>`;
  modal.appendChild(controls);

  const selector = document.createElement("div");
  selector.style.marginTop = "10px";

  // TODO print targets from their definition object
  selector.innerHTML = `
    <b>Choose your editor: </b>
    <div class="locatorjs-editors-options">
      ${Object.entries(allTargets)
        .map(([key, target]) => {
          return `<label class="locatorjs-option"><input type="radio" name="locatorjs-option" value="${key}" /> ${target.label}</label>`;
        })
        .join("\n")}
      <label class="locatorjs-option"><input type="radio" name="locatorjs-option" value="other" /> Other</label>
    </div>
    <input class="locatorjs-custom-template-input" type="text" value="${linkTemplateUrl()}" />
    `;
  modal.appendChild(selector);

  const input = modal.querySelector(
    ".locatorjs-custom-template-input"
  ) as HTMLInputElement;
  input.style.display = "none";

  // locatorjs-options should be clickable
  const options = modal.querySelectorAll(
    ".locatorjs-editors-options input"
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
        input.value = linkTemplateUrl();
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
  closeButton.addEventListener("click", goToHiddenHandler);
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
    backgroundColor: "#333",
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
    `LocatorJS will be now hidden.\n\nPress and hold ${altTitle} so start selecting in hidden mode.\n${altTitle}+D: To show UI`
  );
}

function getDataForDataId(dataId: string) {
  const [fileFullPath, id] = parseDataId(dataId);

  const fileData = dataByFilename[fileFullPath];
  if (!fileData) {
    return;
  }
  const expData = fileData.expressions[Number(id)];
  if (!expData) {
    return;
  }

  return { fileData, expData };
}

export default function nonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}
