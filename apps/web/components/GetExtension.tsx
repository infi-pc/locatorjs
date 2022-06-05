import React from "react";
import { extensionLink, useBrowser } from "./shared";
import chrome from "../public/chrome.svg";
import Image from "next/image";

function GetExtension() {
  const browser = useBrowser();
  return (
    <section className="mt-4 text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container px-4 mx-auto ">
        <div
          className="flex flex-col w-full p-4 py-24 text-center bg-slate-50 rounded-3xl"
          style={{
            background:
              "linear-gradient(90deg, rgba(206,72,56,0.15) 0%, rgba(242,193,71,0.15) 100%);",
          }}
        >
          <h3 className="mb-4 text-2xl font-medium text-gray-900 font-display sm:text-5xl title-font dark:text-white">
            Get browser extension
          </h3>
          <p className="mx-auto text-base leading-relaxed lg:w-2/3"></p>
          {browser && (
            <div className="flex justify-center mt-8">
              {browser === "chrome" ? (
                <a
                  href={extensionLink.chrome}
                  className="flex gap-3 px-6 py-3 text-lg text-gray-700 transition-shadow bg-white border-0 shadow-lg rounded-xl hover:shadow-xl"
                >
                  <Image
                    src={chrome}
                    className="w-8 h-8"
                    height={32}
                    width={32}
                    alt="Chrome"
                  />
                  <div className="text-left">
                    <div className="-mt-1 font-medium">Get extension</div>
                    <div className="-mt-1 text-xs">on Chrome Web Store</div>
                  </div>
                </a>
              ) : browser === "firefox" ? (
                <a
                  href={extensionLink.firefox}
                  className="px-8 py-3 text-lg transition-shadow bg-white border-0 shadow-lg bg-white-500 focus:outline-none hover:bg-white-600 rounded-xl hover:shadow-xl"
                >
                  Get Firefox Extension
                </a>
              ) : (
                <a
                  href={extensionLink.chrome}
                  className="px-8 py-3 text-lg transition-shadow bg-white border-0 shadow-lg bg-white-500 focus:outline-none hover:bg-white-600 rounded-xl hover:shadow-xl"
                >
                  Get Extension on Chrome Web Store
                </a>
              )}
            </div>
          )}
          <div className="mt-8">
            All supported browsers:
            <div className="flex justify-center gap-2">
              <a
                href={extensionLink.chrome}
                className="px-2 py-1 text-lg border-0 rounded text-sky-500 focus:outline-none hover:bg-gray-100"
              >
                Chrome
              </a>
              <a
                href={extensionLink.chrome}
                className="px-2 py-1 text-lg border-0 rounded text-sky-500 focus:outline-none hover:bg-gray-100"
              >
                Edge
              </a>
              <a
                href={extensionLink.chrome}
                className="px-2 py-1 text-lg border-0 rounded text-sky-500 focus:outline-none hover:bg-gray-100"
              >
                Brave
              </a>
              <a
                href={extensionLink.chrome}
                className="px-2 py-1 text-lg border-0 rounded text-sky-500 focus:outline-none hover:bg-gray-100"
              >
                Opera
              </a>
              <a
                href={extensionLink.firefox}
                className="px-2 py-1 text-lg border-0 rounded text-sky-500 focus:outline-none hover:bg-gray-100"
              >
                Firefox
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GetExtension;
