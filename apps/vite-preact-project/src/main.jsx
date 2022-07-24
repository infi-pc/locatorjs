import { render } from "preact";
import { App } from "./app";
import "./index.css";
import setupLocatorUI from "@locator/runtime";

setupLocatorUI();
render(<App />, document.getElementById("app"));
