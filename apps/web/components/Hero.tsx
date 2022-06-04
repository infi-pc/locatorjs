import Image from "next/image";
import React from "react";
import demo from "../public/demo3.gif";
import background from "../public/bg.svg";
import { extensionLink, useBrowser } from "./shared";

const isMac =
  typeof navigator !== "undefined" &&
  navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const altTitle = isMac ? "⌥ Option" : "Alt";

function Hero() {
  const browser = useBrowser();
  return (
    <section className="text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900 ">
      <div className="container relative flex flex-col items-center px-5 py-24 mx-auto md:flex-row">
        <div className="absolute top-1/2 -right-0 md:w-8/12 md:-right-16 md:top-24 lg:-right-32 lg:top-10 xl:top-0 2xl:-top-10 opacity-20">
          <Image src={background} />
        </div>
        <div className="flex flex-col items-center mb-16 text-center lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 md:items-start md:text-left md:mb-0 ">
          <h1 className="mb-4 text-2xl font-bold text-gray-900 title-font sm:text-5xl lg:text-7xl dark:text-white">
            Click on a component to go to its code
          </h1>
          <p className="text-lg leading-relaxed">
            A React dev tool that lets you click on any component in the browser
            to open its code in your IDE.
          </p>
          <div className="mt-4 text-xl font-bold">Try it here and now:</div>
          <div className="flex flex-col justify-center gap-3 mt-4 font-bold">
            <div>
              Hold{" "}
              <span className="px-2 py-1 mx-1 border border-gray-300 rounded-md">
                {altTitle}
              </span>{" "}
              and move with cursor around this page.
            </div>
          </div>
          {browser && (
            <div className="mt-2">
              or get{" "}
              {browser === "firefox" ? (
                <a
                  className="underline text-sky-500"
                  href={extensionLink.firefox}
                >
                  Firefox Extension
                </a>
              ) : browser === "chrome" ? (
                <a
                  className="underline text-sky-500"
                  href={extensionLink.chrome}
                >
                  Chrome Extension
                </a>
              ) : (
                <a
                  className="underline text-sky-500"
                  href={extensionLink.chrome}
                >
                  Extension (via Chrome Web Store)
                </a>
              )}{" "}
              right away.
            </div>
          )}
        </div>
        <div className="z-10 flex object-cover object-center w-full overflow-hidden rounded-lg shadow-2xl md:w-1/2 bg-slate-100">
          <Image className="w-full" src={demo}></Image>
        </div>
      </div>
    </section>
  );
}

export default Hero;
