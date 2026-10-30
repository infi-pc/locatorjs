import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";

// The component to render inside the Shadow DOM
function ShadowDomInside() {
  return (
    <div>
      <h1>Hello from inside the Shadow DOM!</h1>
      <div>hoo</div>
    </div>
  );
}

function ShadowDomTest() {
  const shadowHostRef = useRef<HTMLDivElement | null>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    if (shadowHostRef.current && !shadowRootRef.current) {
      shadowRootRef.current = shadowHostRef.current.attachShadow({
        mode: "open",
      });
      if (shadowRootRef.current) {
        const mountPoint = document.createElement("div");
        shadowRootRef.current.appendChild(mountPoint);
        const root = ReactDOM.createRoot(mountPoint);
        root.render(<ShadowDomInside />);
      }
    }
  }, []);

  return <div ref={shadowHostRef}></div>;
}

export default ShadowDomTest;
