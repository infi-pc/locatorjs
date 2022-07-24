import React from "react";

export default function Contribute() {
  return (
    <section className="px-4 mt-4 text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container px-5 py-24 mx-auto rounded-3xl bg-slate-100">
        <div className="flex flex-col w-full text-center">
          <h2 className="mb-4 text-2xl font-medium text-gray-900 font-display sm:text-5xl title-font dark:text-white">
            Contribute
          </h2>
          <p className="mx-auto text-base leading-relaxed lg:w-2/3">
            LocatorJS is Open source (MIT license). You can help by making a
            pull request by creating an issue or just by spreading the word.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 mt-8 sm:flex-row">
            <a
              href="https://github.com/infi-pc/locatorjs"
              className="px-6 py-2 text-lg text-indigo-700 bg-indigo-100 rounded-lg shadow-xl focus:outline-none hover:bg-indigo-200"
            >
              GitHub repo
            </a>
            <a
              href="https://github.com/infi-pc/locatorjs/issues"
              className="px-6 py-2 text-lg bg-white rounded-lg shadow-xl text-slate-700 focus:outline-none hover:bg-slate-50"
            >
              GitHub Issues
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
