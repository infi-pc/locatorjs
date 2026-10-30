import React from "react";
import ReactDOM from "react-dom/client";
import setupLocatorUI from "@locator/runtime";
import { ShadowScenarios } from "./ShadowScenarios";
import { IframeScenarios } from "./IframeScenarios";

if (process.env.NODE_ENV === "development") {
  setupLocatorUI();
}

function EmbeddingApp() {
  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <h1>Locator embedding scenarios</h1>
      <p>Top-level document heading</p>
      <div style={{ display: "flex", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <ShadowScenarios />
        </div>
        <div style={{ flex: 1 }}>
          <IframeScenarios />
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <EmbeddingApp />
  </React.StrictMode>
);
