import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

/**
 * Content rendered inside each shadow root. Rendered with its own React root so
 * the fiber tree really lives behind the shadow boundary.
 */
function ShadowContent({ label }: { label: string }) {
  return (
    <div className="shadow-content">
      <h3>{label}</h3>
      <p>paragraph in {label}</p>
    </div>
  );
}

function Scenario({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ border: "1px solid #ccc", margin: 8, padding: 8 }}>
      <h2 style={{ fontSize: 14, margin: "0 0 4px" }}>{title}</h2>
      <p style={{ color: "#666", fontSize: 12, margin: "0 0 8px" }}>{hint}</p>
      {children}
    </section>
  );
}

type WindowWithClosedRoot = Window & { __closedShadowRoot?: ShadowRoot };

function mountShadowContent(root: ShadowRoot | Element, label: string) {
  const mountPoint = document.createElement("div");
  root.appendChild(mountPoint);
  createRoot(mountPoint).render(<ShadowContent label={label} />);
  return mountPoint;
}

/** Shadow root attached during the very first layout effect (before Locator's init). */
function EagerShadow() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const done = useRef(false);
  useEffect(() => {
    if (!hostRef.current || done.current) return;
    done.current = true;
    const shadow = hostRef.current.attachShadow({ mode: "open" });
    mountShadowContent(shadow, "eager open shadow");
  }, []);
  return <div data-testid="eager-shadow-host" ref={hostRef} />;
}

/** Shadow root attached only after the user clicks — always after Locator's init. */
function LateShadow() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [attached, setAttached] = useState(false);
  return (
    <div>
      <button
        data-testid="attach-late-shadow"
        onClick={() => {
          if (!hostRef.current || attached) return;
          const shadow = hostRef.current.attachShadow({ mode: "open" });
          mountShadowContent(shadow, "late open shadow");
          setAttached(true);
        }}
      >
        Attach late shadow root
      </button>
      <div data-testid="late-shadow-host" ref={hostRef} />
    </div>
  );
}

/** Shadow root inside another shadow root — `querySelectorAll` cannot see this. */
function NestedShadow() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const done = useRef(false);
  useEffect(() => {
    if (!hostRef.current || done.current) return;
    done.current = true;
    const outer = hostRef.current.attachShadow({ mode: "open" });
    const outerWrap = document.createElement("div");
    outerWrap.textContent = "outer shadow wrapper";
    outer.appendChild(outerWrap);

    const innerHost = document.createElement("div");
    outerWrap.appendChild(innerHost);
    const inner = innerHost.attachShadow({ mode: "open" });
    mountShadowContent(inner, "nested open shadow");
  }, []);
  return <div data-testid="nested-shadow-host" ref={hostRef} />;
}

/**
 * Closed shadow root. `host.shadowRoot` is null and the composed event path
 * stops at the host, so the only way in is to have seen the root at the moment
 * it was attached. Attached on click to keep that ordering explicit.
 */
function ClosedShadow() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [attached, setAttached] = useState(false);
  return (
    <div>
      <button
        data-testid="attach-closed-shadow"
        onClick={() => {
          if (!hostRef.current || attached) return;
          const shadow = hostRef.current.attachShadow({ mode: "closed" });
          mountShadowContent(shadow, "closed shadow");
          // Nothing outside can reach a closed root, so the test needs a handle
          // to work out where its paragraph ended up on screen.
          (window as WindowWithClosedRoot).__closedShadowRoot = shadow;
          setAttached(true);
        }}
      >
        Attach closed shadow root
      </button>
      <div data-testid="closed-shadow-host" ref={hostRef} />
    </div>
  );
}

/** Custom element that attaches its shadow root in its own constructor. */
class LocatorTestElement extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const shadow = this.attachShadow({ mode: "open" });
    const wrap = document.createElement("div");
    wrap.className = "custom-element-content";
    wrap.innerHTML =
      "<h3>custom element shadow</h3><p>paragraph in custom element shadow</p>";
    shadow.appendChild(wrap);
  }
}
if (!customElements.get("locator-test-element")) {
  customElements.define("locator-test-element", LocatorTestElement);
}

function CustomElementShadow() {
  return <locator-test-element data-testid="custom-element-host" />;
}

/** Slotted light-DOM children: the element lives in the document, rendered through a slot. */
function SlottedShadow() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const done = useRef(false);
  useEffect(() => {
    if (!hostRef.current || done.current) return;
    done.current = true;
    const shadow = hostRef.current.attachShadow({ mode: "open" });
    shadow.innerHTML = "<div><slot></slot></div>";
  }, []);
  return (
    <div data-testid="slotted-shadow-host" ref={hostRef}>
      <p>slotted light dom paragraph</p>
    </div>
  );
}

export function ShadowScenarios() {
  return (
    <div>
      <h1>Shadow DOM scenarios</h1>
      <Scenario
        title="1. Eager open shadow root"
        hint="Attached in the first effect, i.e. usually before Locator's runtime scan."
      >
        <EagerShadow />
      </Scenario>
      <Scenario
        title="2. Late open shadow root"
        hint="Attached on click, always after Locator's runtime scan."
      >
        <LateShadow />
      </Scenario>
      <Scenario
        title="3. Nested open shadow root"
        hint="Shadow root inside a shadow root; document.querySelectorAll cannot reach it."
      >
        <NestedShadow />
      </Scenario>
      <Scenario
        title="4. Closed shadow root"
        hint="Attached on click. host.shadowRoot is null and events retarget to the host."
      >
        <ClosedShadow />
      </Scenario>
      <Scenario
        title="5. Custom element with shadow root"
        hint="Autonomous custom element attaching its own shadow root."
      >
        <CustomElementShadow />
      </Scenario>
      <Scenario
        title="6. Slotted light DOM"
        hint="Element is in the document but painted inside the shadow tree."
      >
        <SlottedShadow />
      </Scenario>
    </div>
  );
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "locator-test-element": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}
