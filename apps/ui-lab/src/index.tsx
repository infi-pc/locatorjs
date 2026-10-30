import { render } from "solid-js/web";
import { App } from "./App";
import "./index.css";

const root = document.getElementById("root");

if (!root) throw new Error("UI lab root element is missing");

render(() => <App />, root);
