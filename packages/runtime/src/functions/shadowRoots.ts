import {
  __resetSharedShadowRootsForTesting,
  getSharedShadowRootOf,
  getSharedShadowRoots,
  installSharedShadowRootTracking,
  observeSharedShadowRoots,
} from "@locator/shared";

export function __resetShadowRootsForTesting() {
  stopPointerObservation?.();
  stopPointerObservation = undefined;
  __resetSharedShadowRootsForTesting();
  pointerCursorActive = false;
}

export function installShadowRootTracking() {
  installSharedShadowRootTracking();
}

export function observeShadowRoots(listener: (root: ShadowRoot) => void) {
  return observeSharedShadowRoots((root) => {
    if (pointerCursorActive) applyPointerCursor(root, true);
    listener(root);
  });
}

export function getShadowRoots(): ShadowRoot[] {
  return getSharedShadowRoots();
}

export function getShadowRootOf(element: Element): ShadowRoot | null {
  return getSharedShadowRootOf(element);
}

/**
 * Scroll does not cross shadow boundaries. Track it without retaining roots
 * after their hosts leave the document.
 */
export function listenForShadowRootScrolls(listener: EventListener) {
  const roots = new Set<ShadowRoot>();
  const prune = () => {
    for (const root of roots) {
      if (root.host.isConnected) continue;
      root.removeEventListener("scroll", listener, { capture: true });
      roots.delete(root);
    }
  };
  const mutationObserver = new MutationObserver(prune);
  mutationObserver.observe(document, { childList: true, subtree: true });
  const stop = observeShadowRoots((root) => {
    prune();
    if (roots.has(root)) return;
    roots.add(root);
    root.addEventListener("scroll", listener, { capture: true });
    mutationObserver.observe(root, { childList: true, subtree: true });
  });
  return () => {
    stop();
    mutationObserver.disconnect();
    for (const root of roots) {
      root.removeEventListener("scroll", listener, { capture: true });
    }
    roots.clear();
  };
}

const POINTER_CURSOR_CSS = "*{cursor:pointer !important}";
const STYLE_ELEMENT_ID = "locatorjs-shadow-cursor";

let pointerCursorActive = false;
let pointerCursorSheet: CSSStyleSheet | null | undefined;
let stopPointerObservation: (() => void) | undefined;

function getPointerCursorSheet() {
  if (pointerCursorSheet !== undefined) return pointerCursorSheet;
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(POINTER_CURSOR_CSS);
    pointerCursorSheet = sheet;
  } catch {
    // No constructible stylesheets: fall back to a <style> element.
    pointerCursorSheet = null;
  }
  return pointerCursorSheet;
}

function applyPointerCursor(root: ShadowRoot, active: boolean) {
  const sheet = "adoptedStyleSheets" in root ? getPointerCursorSheet() : null;
  if (sheet) {
    const has = root.adoptedStyleSheets.includes(sheet);
    if (active && !has) {
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    } else if (!active && has) {
      root.adoptedStyleSheets = root.adoptedStyleSheets.filter(
        (item) => item !== sheet
      );
    }
    return;
  }

  const existing = root.getElementById?.(STYLE_ELEMENT_ID);
  if (active && !existing) {
    const style = document.createElement("style");
    style.id = STYLE_ELEMENT_ID;
    style.textContent = POINTER_CURSOR_CSS;
    root.appendChild(style);
  } else if (!active && existing) {
    existing.remove();
  }
}

/** Pushes the page-level pointer cursor rule across every shadow boundary. */
export function setPointerCursorInShadowRoots(active: boolean) {
  pointerCursorActive = active;
  if (active) {
    stopPointerObservation ??= observeSharedShadowRoots((root) => {
      if (pointerCursorActive) applyPointerCursor(root, true);
    });
  }
  for (const root of getSharedShadowRoots()) applyPointerCursor(root, active);
  if (!active) {
    stopPointerObservation?.();
    stopPointerObservation = undefined;
  }
}
