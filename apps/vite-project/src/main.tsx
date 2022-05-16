// TODO make import somehow universal for esmodule and compiled
import "@locator/react-devtools-hook/src/autoInstallDevtoolsHook";
import "@locator/runtime/src";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
