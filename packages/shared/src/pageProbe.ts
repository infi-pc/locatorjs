/**
 * Page probe: which supported frameworks are rendering on a page, and whether
 * their development-only source metadata is actually there.
 *
 * Every framework Locator supports leaves that metadata on DOM nodes, so this
 * is a DOM sample rather than a hook into any framework. It must run in the
 * page's own JavaScript world: expando properties such as `__reactFiber$…` are
 * invisible from an extension's isolated world.
 *
 * Verified markers (see docs/page-probe-and-popup-status.md):
 * - React: `__reactFiber$<key>` / `__reactContainer$<key>` on host nodes in
 *   dev and prod; `_debugOwner` exists on fibers only in dev builds.
 * - Vue 3: `__vueParentComponent` on elements in dev (non-enumerable, so use
 *   `in`); `window.__VUE__` is set by production builds too.
 * - Svelte: `__svelte_meta.loc` on elements when compiled with `dev: true`.
 * - babel-jsx: `data-locatorjs-id` / `data-locatorjs` attributes.
 */

export type FrameworkId = "react" | "vue" | "svelte" | "jsx";

export type FrameworkEvidence = {
  id: FrameworkId;
  /** Something from this framework is rendering on the page. */
  present: boolean;
  /** The dev-only metadata the adapter needs is actually on the nodes. */
  sourceInfo: boolean;
};

export type PageProbe = {
  /** Frameworks with any evidence at all, in no particular order. */
  frameworks: FrameworkEvidence[];
  /** Names of frameworks Locator does not support, for popup copy only. */
  unsupported: string[];
  /** Whether `document.body` had element children when probed. */
  rendered: boolean;
};

export type ProbeOptions = {
  /** Extra roots to sample, typically tracked shadow roots. */
  roots?: Iterable<ParentNode>;
  /** Upper bound on visited elements across all roots. */
  limit?: number;
};

const DEFAULT_LIMIT = 1500;

/** Explicit instrumentation first, then framework-native dev metadata. */
export const ADAPTER_PRIORITY: readonly FrameworkId[] = [
  "jsx",
  "svelte",
  "vue",
  "react",
];

export const FRAMEWORK_LABELS: Record<FrameworkId, string> = {
  react: "React",
  vue: "Vue",
  svelte: "Svelte",
  jsx: "JSX",
};

const REACT_FIBER_PREFIXES = [
  "__reactFiber$",
  "__reactContainer$",
  // React 16
  "__reactInternalInstance$",
];

const JSX_SELECTOR = "[data-locatorjs-id],[data-locatorjs]";

const UNSUPPORTED_MARKERS: ReadonlyArray<[selector: string, name: string]> = [
  ["[ng-version]", "Angular"],
];

type Evidence = { present: boolean; sourceInfo: boolean };

type Expando = Record<string, unknown>;

/** The fiber react-dom stored on a host node, or undefined. */
export function getReactFiber(node: Node): Expando | undefined {
  for (const key of Object.keys(node)) {
    for (const prefix of REACT_FIBER_PREFIXES) {
      if (key.startsWith(prefix)) {
        const fiber = (node as unknown as Expando)[key];
        return fiber && typeof fiber === "object"
          ? (fiber as Expando)
          : undefined;
      }
    }
  }
  return undefined;
}

/** Dev builds assign `_debugOwner` in the FiberNode constructor; prod never does. */
export function isDevFiber(fiber: object): boolean {
  return "_debugOwner" in fiber;
}

function readReact(element: Element, evidence: Evidence) {
  if (evidence.sourceInfo) return;
  const fiber = getReactFiber(element);
  if (!fiber) return;
  evidence.present = true;
  if (isDevFiber(fiber)) evidence.sourceInfo = true;
}

function readVue(element: Element, evidence: Evidence) {
  if (evidence.sourceInfo) return;
  if ("__vueParentComponent" in element) {
    evidence.present = true;
    evidence.sourceInfo = true;
  }
}

function readSvelte(element: Element, evidence: Evidence) {
  if (evidence.sourceInfo) return;
  const meta = (element as unknown as Expando).__svelte_meta;
  if (meta && typeof meta === "object" && "loc" in meta) {
    evidence.present = true;
    evidence.sourceInfo = true;
    return;
  }
  // Scoped class hashes survive production builds.
  const className = element.getAttribute("class");
  if (className && /(?:^|\s)svelte-[a-z0-9]+(?:\s|$)/i.test(className)) {
    evidence.present = true;
  }
}

function* elementsOf(root: ParentNode): Generator<Element> {
  const doc = root.ownerDocument ?? (root as Document);
  const start =
    root.nodeType === Node.DOCUMENT_NODE
      ? (root as Document).documentElement
      : root;
  if (!start) return;
  const walker = doc.createTreeWalker(start, NodeFilter.SHOW_ELEMENT);
  let node: Node | null = start.nodeType === Node.ELEMENT_NODE ? start : null;
  if (node) yield node as Element;
  while ((node = walker.nextNode())) yield node as Element;
}

export function probePage(
  doc: Document = document,
  options: ProbeOptions = {}
): PageProbe {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const roots: ParentNode[] = [doc, ...(options.roots ?? [])];

  const react: Evidence = { present: false, sourceInfo: false };
  const vue: Evidence = { present: false, sourceInfo: false };
  const svelte: Evidence = { present: false, sourceInfo: false };
  const jsx: Evidence = { present: false, sourceInfo: false };

  // Vue writes to `getGlobalThis()`, which is the page window in a browser
  // and the Node global under jsdom.
  const globals: unknown[] = [doc.defaultView, globalThis];
  if (globals.some((g) => (g as Expando | null)?.__VUE__ === true)) {
    vue.present = true;
  }

  for (const root of roots) {
    if (root.querySelector(JSX_SELECTOR)) {
      jsx.present = true;
      jsx.sourceInfo = true;
      break;
    }
  }

  let visited = 0;
  outer: for (const root of roots) {
    for (const element of elementsOf(root)) {
      if (visited++ >= limit) break outer;
      readReact(element, react);
      readVue(element, vue);
      readSvelte(element, svelte);
      if (react.sourceInfo && vue.sourceInfo && svelte.sourceInfo) break outer;
    }
  }

  const unsupported: string[] = [];
  for (const [selector, name] of UNSUPPORTED_MARKERS) {
    if (doc.querySelector(selector)) unsupported.push(name);
  }

  const frameworks: FrameworkEvidence[] = [];
  const push = (id: FrameworkId, evidence: Evidence) => {
    if (evidence.present) frameworks.push({ id, ...evidence });
  };
  push("react", react);
  push("vue", vue);
  push("svelte", svelte);
  push("jsx", jsx);

  return {
    frameworks,
    unsupported,
    rendered: (doc.body?.childElementCount ?? 0) > 0,
  };
}

/** The adapter to drive the page with, or null when nothing usable is there. */
export function chooseAdapter(probe: PageProbe): FrameworkId | null {
  for (const id of ADAPTER_PRIORITY) {
    const evidence = probe.frameworks.find((entry) => entry.id === id);
    if (evidence?.sourceInfo) return id;
  }
  return null;
}
