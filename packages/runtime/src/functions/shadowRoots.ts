/**
 * Registry of every shadow root on the page.
 *
 * Open shadow roots can be walked from the document, but only the ones that
 * exist at the moment of the walk, and `querySelectorAll` never crosses a
 * shadow boundary so nested roots stay invisible. Closed shadow roots cannot be
 * found from the outside at all - `host.shadowRoot` is `null`.
 *
 * So we do both: an initial recursive scan for roots that already exist, and a
 * patched `attachShadow` that records everything created afterwards, closed
 * roots included. The patch returns the untouched native root, so pages cannot
 * tell the difference.
 */

const LOCATOR_WRAPPER_ID = "locatorjs-wrapper";

const shadowRoots = new Set<ShadowRoot>();
/** Closed roots are not reachable via `host.shadowRoot`, so we keep the link. */
const closedRootsByHost = new WeakMap<Element, ShadowRoot>();
const listeners = new Set<(root: ShadowRoot) => void>();

let initialized = false;

function isLocatorRoot(root: ShadowRoot) {
  return (root.host as HTMLElement | null)?.id === LOCATOR_WRAPPER_ID;
}

function register(root: ShadowRoot) {
  if (shadowRoots.has(root) || isLocatorRoot(root)) {
    return;
  }
  shadowRoots.add(root);
  if (root.mode === "closed") {
    closedRootsByHost.set(root.host, root);
  }
  if (pointerCursorActive) {
    applyPointerCursor(root, true);
  }
  for (const listener of listeners) {
    listener(root);
  }
}

function scan(root: Document | ShadowRoot) {
  root.querySelectorAll("*").forEach((node) => {
    const nested = node.shadowRoot;
    if (nested) {
      register(nested);
      scan(nested);
    }
  });
}

function patchAttachShadow() {
  const proto = Element.prototype as Element & {
    __locatorPatchedAttachShadow?: boolean;
  };
  if (proto.__locatorPatchedAttachShadow || !proto.attachShadow) {
    return;
  }
  const original = proto.attachShadow;
  proto.attachShadow = function attachShadow(
    this: Element,
    init: ShadowRootInit
  ) {
    const root = original.call(this, init);
    try {
      register(root);
    } catch {
      // Never let bookkeeping break the page's own component.
    }
    return root;
  };
  proto.__locatorPatchedAttachShadow = true;
}

function init() {
  if (initialized || typeof document === "undefined") {
    return;
  }
  initialized = true;
  patchAttachShadow();
  scan(document);
}

/** Clears the registry so a test can start from a known state. */
export function __resetShadowRootsForTesting() {
  shadowRoots.clear();
  listeners.clear();
  pointerCursorActive = false;
  initialized = false;
}

/**
 * Start tracking shadow roots. Safe to call repeatedly; only the first call
 * does anything. Worth calling as early as possible, because closed roots
 * attached before the patch is in place cannot be recovered later.
 */
export function installShadowRootTracking() {
  init();
}

/**
 * Subscribe to every shadow root, current and future. Returns an unsubscribe
 * function; the `attachShadow` patch itself stays in place because other page
 * code may have captured the patched reference.
 */
export function observeShadowRoots(listener: (root: ShadowRoot) => void) {
  init();
  listeners.add(listener);
  for (const root of shadowRoots) {
    listener(root);
  }
  return () => {
    listeners.delete(listener);
  };
}

/** All known shadow roots, in registration order. */
export function getShadowRoots(): ShadowRoot[] {
  init();
  return Array.from(shadowRoots);
}

/**
 * The shadow root hosted by `element`, including closed roots we recorded when
 * they were attached.
 */
export function getShadowRootOf(element: Element): ShadowRoot | null {
  init();
  return element.shadowRoot ?? closedRootsByHost.get(element) ?? null;
}

const POINTER_CURSOR_CSS = "*{cursor:pointer !important}";
const STYLE_ELEMENT_ID = "locatorjs-shadow-cursor";

let pointerCursorActive = false;
let pointerCursorSheet: CSSStyleSheet | null | undefined;

function getPointerCursorSheet() {
  if (pointerCursorSheet !== undefined) {
    return pointerCursorSheet;
  }
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

/**
 * The page-level `.locatorjs-active-pointer *` rule cannot cross a shadow
 * boundary, so the pointer cursor has to be pushed into every shadow root.
 */
export function setPointerCursorInShadowRoots(active: boolean) {
  init();
  pointerCursorActive = active;
  for (const root of shadowRoots) {
    applyPointerCursor(root, active);
  }
}
