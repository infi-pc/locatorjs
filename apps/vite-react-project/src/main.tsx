import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import setupLocatorUI from "@locator/runtime";

// setupLocatorUI({
//   adapter: "jsx",
// });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
