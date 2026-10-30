import React from "react";
import ReactDOM from "react-dom/client";

function BareIframeChild() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 8 }}>
      <h3>bare iframe heading</h3>
      <p>bare iframe paragraph</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BareIframeChild />
  </React.StrictMode>
);
