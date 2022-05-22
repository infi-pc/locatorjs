import React from "react";

function GetExtension() {
  return (
    <section className="mt-4 text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container px-4 mx-auto ">
        <div className="flex flex-col w-full p-4 py-24 text-center bg-slate-50 rounded-3xl">
          <h1 className="mb-4 text-2xl font-medium text-gray-900 sm:text-5xl title-font dark:text-white">
            Chrome Extension
          </h1>
          <p className="mx-auto text-base leading-relaxed lg:w-2/3"></p>
          <div className="mt-8">
            <a
              href="https://chrome.google.com/webstore/detail/locatorjs/npbfdllefekhdplbkdigpncggmojpefi"
              className="px-8 py-3 text-lg text-white border-0 rounded bg-primary-500 focus:outline-none hover:bg-primary-600"
            >
              Get Chrome Extension
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GetExtension;
