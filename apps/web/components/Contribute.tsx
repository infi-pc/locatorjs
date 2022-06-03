import React from "react";

export default function Contribute() {
  return (
    <section className="mt-4 text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container px-5 py-24 mx-auto">
        <div className="flex flex-col w-full text-center">
          <h1 className="mb-4 text-2xl font-medium text-gray-900 sm:text-5xl title-font dark:text-white">
            Contribute
          </h1>
          <p className="mx-auto text-base leading-relaxed lg:w-2/3">
            LocatorJS is Open source (MIT license). You can help by making a
            pull request by creating an issue or just by spreading the word.
          </p>
          <div className="flex items-center justify-center gap-4 my-8">
            <a
              href="https://github.com/infi-pc/locatorjs/blob/master/contributig.md"
              className="px-6 py-2 text-lg border rounded  text-primary-500 border-primary-500 focus:outline-none hover:text-primary-400"
            >
              Contribution readme
            </a>
            <a
              href="https://github.com/infi-pc/locatorjs/issues"
              className="px-6 py-2 text-lg border rounded  text-primary-500 border-primary-500 focus:outline-none hover:text-primary-400"
            >
              GitHub Issues
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
