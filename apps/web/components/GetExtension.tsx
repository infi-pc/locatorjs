import React from "react";
import { extensionLink, useBrowser } from "./shared";

function GetExtension() {
  const browser = useBrowser();
  return (
    <section className="mt-4 text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container px-4 mx-auto ">
        <div className="flex flex-col w-full p-4 py-24 text-center bg-slate-50 rounded-3xl">
          <h1 className="mb-4 text-2xl font-medium text-gray-900 sm:text-5xl title-font dark:text-white">
            Get Browser extension
          </h1>
          <p className="mx-auto text-base leading-relaxed lg:w-2/3"></p>
          {browser && (
            <div className="mt-8">
              {browser === "chrome" ? (
                <a
                  href={extensionLink.chrome}
                  className="px-8 py-3 text-lg text-white border-0 rounded bg-primary-500 focus:outline-none hover:bg-primary-600"
                >
                  Get Chrome Extension
                </a>
              ) : browser === "firefox" ? (
                <a
                  href={extensionLink.firefox}
                  className="px-8 py-3 text-lg text-white border-0 rounded bg-primary-500 focus:outline-none hover:bg-primary-600"
                >
                  Get Firefox Extension
                </a>
              ) : (
                <a
                  href={extensionLink.chrome}
                  className="px-8 py-3 text-lg text-white border-0 rounded bg-primary-500 focus:outline-none hover:bg-primary-600"
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
