import "./app.css";
import App from "./App.svelte";
import setupLocatorUI from "@locator/runtime";

if (process.env.NODE_ENV === "development") {
  setupLocatorUI({
    adapter: "svelte",
    // @ts-ignore
    projectPath: __PROJECT_PATH__,
  });
}

const app = new App({
  target: document.getElementById("app"),
});

export default app;
