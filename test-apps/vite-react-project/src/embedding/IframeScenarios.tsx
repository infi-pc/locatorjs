import { useState } from "react";

const frameStyle = { border: "1px solid #99f", height: 160, width: "100%" };

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

/** Same-origin iframe whose document sets up the Locator runtime itself. */
function SameOriginWithRuntime() {
  return (
    <iframe
      data-testid="iframe-same-origin-runtime"
      src="/iframe-child.html"
      style={frameStyle}
      title="same origin with runtime"
    />
  );
}

/** Same-origin iframe with no Locator runtime of its own. */
function SameOriginBare() {
  return (
    <iframe
      data-testid="iframe-same-origin-bare"
      src="/iframe-child-bare.html"
      style={frameStyle}
      title="same origin without runtime"
    />
  );
}

/**
 * Cross-origin iframe. 127.0.0.1 and localhost are different origins even on the
 * same port, which is enough to exercise the cross-origin path locally.
 */
function CrossOrigin() {
  const url = `http://127.0.0.1:${location.port}/iframe-child.html`;
  return (
    <iframe
      data-testid="iframe-cross-origin"
      src={url}
      style={frameStyle}
      title="cross origin"
    />
  );
}

/** Iframe written with srcdoc — same origin, no separate document URL. */
function SrcDoc() {
  return (
    <iframe
      data-testid="iframe-srcdoc"
      srcDoc="<body style='font-family:sans-serif'><h3>srcdoc heading</h3><p>srcdoc paragraph</p></body>"
      style={frameStyle}
      title="srcdoc"
    />
  );
}

/** Iframe appended long after the page (and Locator) has loaded. */
function LateIframe() {
  const [show, setShow] = useState(false);
  return (
    <div>
      <button data-testid="add-late-iframe" onClick={() => setShow(true)}>
        Add late iframe
      </button>
      {show ? (
        <iframe
          data-testid="iframe-late"
          src="/iframe-child.html"
          style={frameStyle}
          title="late iframe"
        />
      ) : null}
    </div>
  );
}

/** Iframe nested inside another iframe, both same origin. */
function NestedIframe() {
  return (
    <iframe
      data-testid="iframe-nested-outer"
      src="/iframe-child.html?nested=1"
      style={{ ...frameStyle, height: 320 }}
      title="nested iframes"
    />
  );
}

export function IframeScenarios() {
  return (
    <div>
      <h1>Iframe scenarios</h1>
      <Scenario
        title="1. Same-origin iframe with its own runtime"
        hint="Child document calls setupLocatorUI() itself."
      >
        <SameOriginWithRuntime />
      </Scenario>
      <Scenario
        title="2. Same-origin iframe without a runtime"
        hint="Only the parent has Locator; the child document is untouched."
      >
        <SameOriginBare />
      </Scenario>
      <Scenario
        title="3. Cross-origin iframe"
        hint="127.0.0.1 vs localhost: parent cannot reach into the document."
      >
        <CrossOrigin />
      </Scenario>
      <Scenario title="4. srcdoc iframe" hint="Same origin, inline document.">
        <SrcDoc />
      </Scenario>
      <Scenario
        title="5. Iframe added after load"
        hint="Appended on click, long after Locator initialised."
      >
        <LateIframe />
      </Scenario>
      <Scenario
        title="6. Nested iframes"
        hint="An iframe inside an iframe, both with their own runtime."
      >
        <NestedIframe />
      </Scenario>
    </div>
  );
}
