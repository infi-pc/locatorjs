import React from "react";
import ReactDOM from "react-dom/client";
import setupLocatorUI from "@locator/runtime";

if (process.env.NODE_ENV === "development") {
  setupLocatorUI();
}

const nested = new URLSearchParams(location.search).has("nested");

function IframeChild() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 8 }}>
      <h3>iframe child heading{nested ? " (outer)" : ""}</h3>
      <p>iframe child paragraph{nested ? " (outer)" : ""}</p>
      {nested ? (
        <iframe
          data-testid="iframe-nested-inner"
          src="/iframe-child.html"
          style={{ border: "1px solid #f99", height: 140, width: "100%" }}
          title="nested inner"
        />
      ) : null}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <IframeChild />
  </React.StrictMode>
);
