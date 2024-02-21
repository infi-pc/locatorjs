import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import setupLocatorUI from "@amirrezadev1378/runtime";

if (process.env.NODE_ENV === "development") {
  setupLocatorUI({
    adapter: "vue",
  });
}

createApp(App).mount("#app");
