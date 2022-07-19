/* @refresh reload */
import { render } from "solid-js/web";
import setupLocatorUI from "@locator/runtime";
import "./index.css";
import App from "./App";

setupLocatorUI();
render(() => <App />, document.getElementById("root"));
