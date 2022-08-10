/* @refresh reload */
import { render } from "solid-js/web";
import setupLocatorUI from "@locator/runtime";
import "./index.css";
import App from "./App";

if (process.env.NODE_ENV === "development") {
  setupLocatorUI();
}

render(() => <App />, document.getElementById("root"));
