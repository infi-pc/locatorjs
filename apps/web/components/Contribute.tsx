import React from "react";

export default function Contribute() {
  return (
    <section className="text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900 mt-4">
      <div className="container px-5 py-24 mx-auto">
        <div className="flex flex-col w-full text-center">
          <h1 className="mb-4 text-2xl font-medium text-gray-900 sm:text-5xl title-font dark:text-white">
            Contribute
          </h1>
          <p className="mx-auto text-base leading-relaxed lg:w-2/3">
            LocatorJS is Open source (MIT license). You can contribute by making
            a pull request by creating an issue or just by spreading the word.
          </p>
          <div className="flex my-8 gap-4 items-center justify-center">
            <a
              href="https://github.com/infi-pc/locatorjs/blob/master/contributig.md"
              className=" text-primary-500 border-primary-500 border py-2 px-6 focus:outline-none hover:text-primary-400 rounded text-lg"
            >
              Contribution readme
            </a>
            <a
              href="https://github.com/infi-pc/locatorjs/issues"
              className=" text-primary-500 border-primary-500 border py-2 px-6 focus:outline-none hover:text-primary-400 rounded text-lg"
            >
              GitHub Issues
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
