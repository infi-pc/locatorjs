import Image from "next/image";
import React from "react";
import demo from "../public/demo3.gif";
import background from "../public/bg.svg";

const isMac =
  typeof navigator !== "undefined" &&
  navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const altTitle = isMac ? "⌥ Option" : "Alt";

function Hero() {
  return (
    <section className="text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900 ">
      <div className="container relative flex flex-col items-center px-5 py-24 mx-auto md:flex-row">
        <div className="absolute top-1/2 -right-0 md:w-8/12 md:-right-16 md:top-24 lg:-right-32 lg:top-10 xl:top-0 2xl:-top-10 opacity-20">
          <Image src={background} />
        </div>
        <div className="flex flex-col items-center mb-16 text-center lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 md:items-start md:text-left md:mb-0 ">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 title-font sm:text-5xl lg:text-7xl dark:text-white">
            Find any component in code
          </h1>
          <p className="leading-relaxed">
            A plugin for React dev stacks that allows you to click through from
            your app to its code.
          </p>
          <div className="mt-4 text-xl font-bold">Try it here and now:</div>
          <div className="flex flex-col justify-center gap-3 mt-4 font-bold">
            <div>
              Hold{" "}
              <span className="px-2 py-1 mx-1 border border-gray-300 rounded-md">
                {altTitle}
              </span>{" "}
              and click on component
            </div>
          </div>
          <div className="mt-2">
            or get{" "}
            <a
              className="underline text-sky-500"
              href="https://chrome.google.com/webstore/detail/locatorjs/npbfdllefekhdplbkdigpncggmojpefi"
            >
              Chrome Extension
            </a>{" "}
            right away.
          </div>
        </div>
        <div className="z-10 flex object-cover object-center w-5/6 overflow-hidden rounded-lg shadow-2xl md:w-1/2">
          <Image className="" src={demo}></Image>
        </div>
      </div>
    </section>
  );
}

export default Hero;
