"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = nonNullable;
exports.getDataForDataId = getDataForDataId;
exports.linkTemplateUrl = void 0;
exports.register = register;
exports.setup = setup;

var _shared = require("@locator/shared");

var _buidLink = require("./buidLink");

var _getLabels = require("./getLabels");

var _isCombinationModifiersPressed = require("./isCombinationModifiersPressed");

var _trackClickStats = require("./trackClickStats");

// import only in browser, because when used as SSR (Next.js), SolidJS (solid-js/web) somehow breaks the page
const initRender = typeof window === "undefined" ? () => {} : require("./Runtime").initRender;
let allTargets = { ..._shared.allTargets
};
const HREF_TARGET = "_self"; // console.log("RUNTIME HERE");

const dataByFilename = {};
const baseColor = "#e90139";
const hoverColor = "#C70139";
const linkColor = "rgb(56 189 248)";
const linkColorHover = "rgb(125 211 252)";
const PADDING = 6;
const fontFamily = "Helvetica, sans-serif, Arial"; // @ts-ignore

let currentElementRef = null;
const isExtension = typeof document !== "undefined" ? !!document.documentElement.dataset.locatorClientUrl : false;
const repoLink = "https://github.com/infi-pc/locatorjs";
let localLinkOrTemplate = getCookie("LOCATOR_CUSTOM_LINK") || "vscode";

let getLinkTypeOrTemplate = () => document.documentElement.dataset.locatorTarget || localLinkOrTemplate;

let linkTemplate = () => allTargets[getLinkTypeOrTemplate()];

let linkTemplateUrl = () => {
  const l = linkTemplate();
  return l ? l.url : getLinkTypeOrTemplate();
};

exports.linkTemplateUrl = linkTemplateUrl;
let modeInCookies = getCookie("LOCATORJS");
let defaultMode = "hidden";

function getModeToRender() {
  const proposedMode = modeInCookies || defaultMode; // TODO do not use it as mode, but as different parameter

  if (proposedMode !== "hidden" && detectMissingRenderers()) {
    return "no-renderer";
  }

  return proposedMode;
}

function setMode(newMode) {
  setCookie("LOCATORJS", newMode);
  modeInCookies = newMode;
}

function setTemplate(lOrTemplate) {
  setCookie("LOCATOR_CUSTOM_LINK", lOrTemplate);
  localLinkOrTemplate = lOrTemplate;
}

if (typeof window !== "undefined") {
  // document.addEventListener("keyup", globalKeyUpListener);
  let locatorDisabled = getModeToRender() === "disabled";

  if (!locatorDisabled) {
    onDocumentLoad(function () {
      init(getModeToRender());
    });
  }
}

function onDocumentLoad(callback) {
  if (document.readyState === "complete") {
    callback();
  } else {
    window.addEventListener("load", callback);
  }
}

function setup(props) {
  if (props.defaultMode) {
    defaultMode = props.defaultMode;
  }

  if (props.targets) {
    allTargets = Object.fromEntries(Object.entries(props.targets).map(([key, target]) => typeof target === "string" ? [key, {
      url: target,
      label: key
    }] : [key, target]));
    const firstKey = Object.keys(allTargets)[0];

    if (!firstKey) {
      throw new Error("no targets found");
    }

    localLinkOrTemplate = firstKey;
  }
}

function register(input) {
  dataByFilename[input.projectPath + input.filePath] = input;
}

function parseDataId(dataId) {
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
} // function globalKeyUpListener(e: KeyboardEvent) {
//   if (e.code === "KeyD" && isCombinationModifiersPressed(e)) {
//     if (getModeToRender() === "hidden") {
//       destroy();
//       if (isExtension) {
//         setMode("minimal");
//         init("minimal");
//       } else {
//         setMode("options");
//         init("options");
//       }
//     } else {
//       destroy();
//       setMode("hidden");
//       init("hidden");
//     }
//     return;
//   }
// }


function clickListener(e) {
  if (!(0, _isCombinationModifiersPressed.isCombinationModifiersPressed)(e)) {
    return;
  }

  const target = e.target;

  if (target && target instanceof HTMLElement) {
    const labels = (0, _getLabels.getLabels)(target);
    const firstLabel = labels[0];

    if (firstLabel) {
      e.preventDefault();
      e.stopPropagation();
      (0, _trackClickStats.trackClickStats)();
      window.open(firstLabel.link, HREF_TARGET);
    }
  }
} // function hideOptionsHandler() {
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

function init(mode) {
  if (document.getElementById("locatorjs-layer")) {
    // already initialized
    return;
  } // add style tag to head


  const style = document.createElement("style");
  style.id = "locatorjs-style";
  style.innerHTML = `
      #locatorjs-solid-layer {
        pointer-events: none;
      }
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
      #locatorjs-missing-renderer a {
        color: #fff;
        text-decoration: underline;
      }
    `;
  document.head.appendChild(style);
  document.addEventListener("scroll", scrollListener);
  document.addEventListener("click", clickListener, {
    capture: true
  }); // add layer to body

  const layer = document.createElement("div");
  layer.setAttribute("id", "locatorjs-layer"); // layer is full screen

  css(layer, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    zIndex: "9999",
    pointerEvents: "none"
  });
  const solidLayer = document.createElement("div");
  solidLayer.setAttribute("id", "locatorjs-solid-layer");
  document.body.appendChild(solidLayer);
  document.body.appendChild(layer);
  initRender(solidLayer);

  if (mode === "no-renderer") {
    showMissingRenderer();
  }

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
    marginBottom: "6px"
  });
  modalHeader.innerHTML = `LocatorJS enabled`;
  modal.appendChild(modalHeader);
  const controls = document.createElement("div");
  controls.style.color = "#aaa";
  controls.innerHTML = `
    <div>
      <div class="locatorjs-line"><b>Press and hold <span class="locatorjs-key">${_shared.altTitle}</span>:</b> make boxes clickable on full surface</div>
      <div class="locatorjs-line"><b><span class="locatorjs-key">${_shared.altTitle}</span> + <span class="locatorjs-key">D</span>:</b> hide/show LocatorJS panel</div>
      <div class="locatorjs-line">
        <a href="${repoLink}">more info</a>
      </div>
    </div>`;
  modal.appendChild(controls);
  const selector = document.createElement("div");
  selector.style.marginTop = "10px"; // TODO print targets from their definition object

  selector.innerHTML = `
    <b>Choose your editor: </b>
    <div class="locatorjs-editors-options">
      ${Object.entries(allTargets).map(([key, target]) => {
    return `<label class="locatorjs-option"><input type="radio" name="locatorjs-option" value="${key}" /> ${target.label}</label>`;
  }).join("\n")}
      <label class="locatorjs-option"><input type="radio" name="locatorjs-option" value="other" /> Other</label>
    </div>
    <input class="locatorjs-custom-template-input" type="text" value="${linkTemplateUrl()}" />
    `;
  modal.appendChild(selector);
  const input = modal.querySelector(".locatorjs-custom-template-input");
  input.style.display = "none"; // locatorjs-options should be clickable

  const options = modal.querySelectorAll(".locatorjs-editors-options input");
  options.forEach(option => {
    if (localLinkOrTemplate === option.value) {
      option.checked = true;
    }

    option.addEventListener("change", e => {
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
    padding: "0px"
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
    fontFamily
  });
  minimal.innerHTML = `
    <div><a href="${repoLink}">LocatorJS</a>: ${isExtension ? `` : `<a id="locatorjs-minimal-to-options">options</a> |`} <a id="locatorjs-minimal-to-hide">hide</a></div>
    `;

  if (!isExtension) {
    const options = minimal.querySelector("#locatorjs-minimal-to-options");
    options.addEventListener("click", showOptionsHandler);
  }

  const hide = minimal.querySelector("#locatorjs-minimal-to-hide");
  hide.addEventListener("click", goToHiddenHandler);
  document.body.appendChild(minimal);
}

function showMissingRenderer() {
  const el = document.createElement("div");
  el.setAttribute("id", "locatorjs-missing-renderer");
  css(el, {
    position: "fixed",
    bottom: "18px",
    left: "18px",
    backgroundColor: baseColor,
    fontSize: "16px",
    borderRadius: "4px",
    padding: "6px 12px",
    color: "white",
    zIndex: "10000",
    fontFamily
  });
  el.innerHTML = `
    <div><a href="${repoLink}">LocatorJS</a> has not found any React project in development mode. <a id="locatorjs-missing-rendered-to-hide">hide</a></div>
    `;
  const hide = el.querySelector("#locatorjs-missing-rendered-to-hide");
  hide.addEventListener("click", hideAlertHandler);
  document.body.appendChild(el);
}

function destroy() {
  const el = document.getElementById("locatorjs-layer");

  if (el) {
    document.removeEventListener("scroll", scrollListener);
    document.removeEventListener("click", clickListener);
    el.remove();
  }

  hideOptions();
  const styleEl = document.getElementById("locatorjs-style");

  if (styleEl) {
    styleEl.remove();
  }

  hideMinimal();
  hideMissingRenderer();

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

function hideMissingRenderer() {
  const minimalEl = document.getElementById("locatorjs-missing-renderer");

  if (minimalEl) {
    minimalEl.remove();
  }
}

function getCookie(name) {
  if (typeof document === "undefined") {
    return;
  }

  var match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  if (match) return match[2];
}

function setCookie(name, value) {
  document.cookie = name + "=" + (value || "") + "; path=/";
}

function css(element, styles) {
  for (const key of Object.keys(styles)) {
    // @ts-ignore
    element.style[key] = styles[key];
  }
}

function goToHiddenHandler() {
  setMode("hidden");
  destroy();
  init("hidden");
  alert(`LocatorJS will be now hidden.\n\nPress and hold ${_shared.altTitle} so start selecting in hidden mode.\n${_shared.altTitle}+D: To show UI`);
}

function hideAlertHandler() {
  setMode("hidden");
  destroy();
  init("hidden");
}

function getDataForDataId(dataId) {
  const [fileFullPath, id] = parseDataId(dataId);
  const fileData = dataByFilename[fileFullPath];

  if (!fileData) {
    return null;
  }

  const expData = fileData.expressions[Number(id)];

  if (!expData) {
    return null;
  }

  const link = (0, _buidLink.buidLink)(fileData.filePath, fileData.projectPath, expData.loc);
  let label;

  if (expData.type === "jsx") {
    label = (expData.wrappingComponent ? `${expData.wrappingComponent}: ` : "") + expData.name;
  } else {
    label = `${expData.htmlTag ? `styled.${expData.htmlTag}` : "styled"}${expData.name ? `: ${expData.name}` : ""}`;
  }

  return {
    link,
    label
  };
}

function nonNullable(value) {
  return value !== null && value !== undefined;
}

function detectMissingRenderers() {
  var _window$__REACT_DEVTO, _window$__REACT_DEVTO2;

  return ((_window$__REACT_DEVTO = window.__REACT_DEVTOOLS_GLOBAL_HOOK__) === null || _window$__REACT_DEVTO === void 0 ? void 0 : (_window$__REACT_DEVTO2 = _window$__REACT_DEVTO.renderers) === null || _window$__REACT_DEVTO2 === void 0 ? void 0 : _window$__REACT_DEVTO2.size) === 0;
}