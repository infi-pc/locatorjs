import Bowser from "bowser";
import { useEffect, useState } from "react";

export const extensionLink = {
  chrome:
    "https://chrome.google.com/webstore/detail/locatorjs/npbfdllefekhdplbkdigpncggmojpefi",
  firefox: "https://addons.mozilla.org/en/firefox/addon/locatorjs/",
};

export const useBrowser = function () {
  const [browser, setBrowser] = useState<
    "firefox" | "chrome" | "edge" | "opera" | null
  >(null);
  useEffect(() => {
    const name =
      typeof window !== "undefined"
        ? Bowser.parse(window.navigator.userAgent).browser.name
        : null;

    console.log("name", name);
    if (name === "Chrome") {
      setBrowser("chrome");
    }
    if (name === "Firefox") {
      setBrowser("firefox");
    }
    if (name === "Microsoft Edge") {
      setBrowser("edge");
    }
    if (name === "Opera") {
      setBrowser("opera");
    }
  }, []);
  return browser;
};
