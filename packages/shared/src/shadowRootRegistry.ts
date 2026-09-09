const LOCATOR_WRAPPER_ID = "locatorjs-wrapper";
const REGISTRY_KEY = Symbol.for("locatorjs.shadowRoots");

type Registry = {
  roots: Set<WeakRef<ShadowRoot>>;
  rootsByRoot: WeakMap<ShadowRoot, WeakRef<ShadowRoot>>;
  closedRootsByHost: WeakMap<Element, ShadowRoot>;
  listeners: Set<(root: ShadowRoot) => void>;
  patched: boolean;
  scanned: boolean;
};

type RegistryGlobal = typeof globalThis & {
  [key: symbol]: Registry | undefined;
};

function createRegistry(patched = false): Registry {
  return {
    roots: new Set(),
    rootsByRoot: new WeakMap(),
    closedRootsByHost: new WeakMap(),
    listeners: new Set(),
    patched,
    scanned: false,
  };
}

function registry(): Registry {
  const target = globalThis as RegistryGlobal;
  return (target[REGISTRY_KEY] ??= createRegistry());
}

function isLocatorRoot(root: ShadowRoot): boolean {
  return (root.host as HTMLElement | null)?.id === LOCATOR_WRAPPER_ID;
}

function register(root: ShadowRoot) {
  const state = registry();
  if (state.rootsByRoot.has(root) || isLocatorRoot(root)) return;
  const reference = new WeakRef(root);
  state.roots.add(reference);
  state.rootsByRoot.set(root, reference);
  if (root.mode === "closed") state.closedRootsByHost.set(root.host, root);
  for (const listener of state.listeners) listener(root);
}

function scan(root: Document | ShadowRoot) {
  root.querySelectorAll("*").forEach((node) => {
    const nested = node.shadowRoot;
    if (!nested) return;
    register(nested);
    scan(nested);
  });
}

function patchAttachShadow() {
  const state = registry();
  if (state.patched || !Element.prototype.attachShadow) return;
  const original = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function attachShadow(init: ShadowRootInit) {
    const root = original.call(this, init);
    try {
      register(root);
    } catch {
      // Registry bookkeeping must never break a page's own component.
    }
    return root;
  };
  state.patched = true;
}

/** Installs the page-global patch once, even when multiple Locator copies load. */
export function installSharedShadowRootTracking() {
  if (typeof document === "undefined") return;
  const state = registry();
  patchAttachShadow();
  if (!state.scanned) {
    state.scanned = true;
    scan(document);
  }
}

/** Returns live roots and compacts references whose roots were collected. */
export function getSharedShadowRoots(): ShadowRoot[] {
  installSharedShadowRootTracking();
  const state = registry();
  const live: ShadowRoot[] = [];
  for (const reference of state.roots) {
    const root = reference.deref();
    if (root) live.push(root);
    else state.roots.delete(reference);
  }
  return live;
}

export function getSharedShadowRootOf(element: Element): ShadowRoot | null {
  installSharedShadowRootTracking();
  if ((element as HTMLElement).id === LOCATOR_WRAPPER_ID) return null;
  return (
    element.shadowRoot ?? registry().closedRootsByHost.get(element) ?? null
  );
}

export function observeSharedShadowRoots(
  listener: (root: ShadowRoot) => void
): () => void {
  installSharedShadowRootTracking();
  const state = registry();
  state.listeners.add(listener);
  for (const root of getSharedShadowRoots()) listener(root);
  return () => state.listeners.delete(listener);
}

export function __resetSharedShadowRootsForTesting() {
  const target = globalThis as RegistryGlobal;
  const patched = target[REGISTRY_KEY]?.patched ?? false;
  target[REGISTRY_KEY] = createRegistry(patched);
}
