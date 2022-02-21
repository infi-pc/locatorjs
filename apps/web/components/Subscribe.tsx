import React from "react";

export default function Subscribe() {
  return (
    <section className="text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900 mt-4">
      <div className="container px-5 py-24 mx-auto">
        <div className="flex flex-col w-full text-center">
          <h1 className="mb-4 text-2xl font-medium text-gray-900 sm:text-5xl title-font dark:text-white">
            Get updated
          </h1>
          <p className="mx-auto text-base leading-relaxed lg:w-2/3">
            Check and follow our Twitter account. (Regular newsletter is comming
            soon)
          </p>
          <div className="flex my-8 gap-4 items-center justify-center">
            <a
              href="https://twitter.com/locatorjs"
              className=" bg-[#1d9bf0] border-0 text-white py-2 px-6 focus:outline-none hover:bg-[#128de0] rounded text-lg"
            >
              Check our Twitter profile
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
