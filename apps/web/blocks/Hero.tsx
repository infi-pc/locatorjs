import Image from "next/image";
import React, { useEffect, useState } from "react";
// import demo from "../public/demo3.gif";
// import demoVideo from "../public/demo.mp4";

import background from "../public/bg.svg";
import { extensionLink, useBrowser } from "./shared";

const isMac =
  typeof navigator !== "undefined" &&
  navigator.platform.toUpperCase().indexOf("MAC") >= 0;
const altTitle = isMac ? "⌥ Option" : "Alt";

function AltTitle() {
  const [currentTitle, setCurrentTitle] = useState("⌥ Option / Alt");
  useEffect(() => {
    setCurrentTitle(altTitle);
  }, []);
  return <>{currentTitle}</>;
}

function Hero() {
  const browser = useBrowser();
  return (
    <section className="text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900 ">
      <div className="container relative flex flex-col items-center px-5 py-24 mx-auto md:flex-row">
        <div className="absolute top-1/2 -right-0 md:w-8/12 md:-right-16 md:top-24 lg:-right-32 lg:top-10 xl:top-0 2xl:-top-10 opacity-20">
          <Image alt="background" src={background} />
        </div>
        <div className="flex flex-col items-center mb-16 text-center lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 md:items-start md:text-left md:mb-0 ">
          <h1 className="mb-4 text-4xl font-semibold text-gray-900 font-display title-font sm:text-5xl lg:text-7xl dark:text-white ">
            Click on a component to go to its code
          </h1>
          <p className="text-lg leading-relaxed">
            Click on any component in the browser to open its code in your IDE.
            <br />
            You can use it as a browser extension <b>or</b> as a library.
            <br />
            For React, Preact, Solid, Vue and Svelte.
          </p>
          <div className="flex-col hidden md:flex ">
            <div className="mt-4 text-xl font-bold">Try it here and now:</div>
            <div className="flex flex-col justify-center gap-3 mt-4 font-bold">
              <div>
                Hold{" "}
                <span className="px-2 py-1 mx-1 border border-gray-300 rounded-md">
                  <AltTitle />
                </span>{" "}
                and move with the cursor around this page.
              </div>
            </div>
            {browser && (
              <div className="mt-2">
                or get{" "}
                {browser === "firefox" ? (
                  <a
                    className="text-indigo-500 underline"
                    href={extensionLink.firefox}
                  >
                    Firefox Extension
                  </a>
                ) : browser === "chrome" ? (
                  <a
                    className="text-indigo-500 underline"
                    href={extensionLink.chrome}
                  >
                    Chrome Extension
                  </a>
                ) : (
                  <a
                    className="text-indigo-500 underline"
                    href={extensionLink.chrome}
                  >
                    Extension (via Chrome Web Store)
                  </a>
                )}{" "}
                right away.
              </div>
            )}
          </div>
        </div>
        <div className="z-10 flex object-cover object-center w-full overflow-hidden rounded-lg shadow-2xl md:w-1/2 bg-slate-100">
          <video
            className="w-full"
            src="demo.mp4"
            autoPlay
            loop
            muted
            playsInline
          />

          {/* autoPlay: true,
        controls: true,
        loop: true,
        muted: true,
        playsInline: true,
        type: "video/mp4",
        src: "/api/files/8fa1b7fe-c562-465f-9efb-94cfd91ccf5d/bdcb09f1-af69-4c99-8706-8999b2462ab7.mp4",
        style: styles, */}

          {/* <Image className="w-full" src={demo}></Image> */}
        </div>
      </div>
    </section>
  );
}

export default Hero;
