import Bowser from "bowser";
import { useEffect, useState } from "react";

export const extensionLink = {
  chrome:
    "https://chrome.google.com/webstore/detail/locatorjs/npbfdllefekhdplbkdigpncggmojpefi",
  firefox: "https://addons.mozilla.org/en/firefox/addon/locatorjs/",
};

type BrowserId = "firefox" | "chrome" | "edge" | "opera" | null;

function getBrowserId() {
  const name =
    typeof window !== "undefined"
      ? Bowser.parse(window.navigator.userAgent).browser.name
      : null;

  if (name === "Chrome") {
    return "chrome";
  }
  if (name === "Firefox") {
    return "firefox";
  }
  if (name === "Microsoft Edge") {
    return "edge";
  }
  if (name === "Opera") {
    return "opera";
  }
  return null;
}

export function getBrowserLink() {
  const id = getBrowserId();
  if (id === "firefox") {
    return extensionLink.firefox;
  }
  return extensionLink.chrome;
}

export const useBrowser = function () {
  const [browser, setBrowser] = useState<BrowserId>(null);
  useEffect(() => {
    setBrowser(getBrowserId());
  }, []);
  return browser;
};
