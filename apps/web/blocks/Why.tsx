import React from "react";
import { HiSearch } from "react-icons/hi";

export default function Why() {
  return (
    <section className="mt-4 text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container px-5 py-24 mx-auto">
        <div className="flex flex-col w-full text-center">
          <h2 className="mb-4 text-2xl font-medium text-gray-900 font-display sm:text-5xl title-font dark:text-white">
            Speed up your web development
          </h2>

          <div className="flex flex-wrap justify-center mt-2 -mx-4 -mb-10 space-y-6 sm:m-4 sm:mt-10 md:space-y-0">
            <div className="flex flex-col items-center p-4 text-center md:w-1/3">
              <div className="inline-flex items-center justify-center flex-shrink-0 w-20 h-20 mb-5 text-2xl text-indigo-500 bg-indigo-100 rounded-full">
                <HiSearch />
              </div>
              <div className="flex-grow">
                <h3 className="mb-3 text-lg font-medium text-gray-900 title-font">
                  Find anything faster
                </h3>
                <p className="text-base leading-relaxed">
                  Don't know every corner of your codebase? Find any component
                  faster than ever.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-center p-4 text-center md:w-1/3">
              <div className="inline-flex items-center justify-center flex-shrink-0 w-20 h-20 mb-5 text-2xl text-indigo-500 bg-indigo-100 rounded-full">
                %
              </div>
              <div className="flex-grow">
                <h3 className="mb-3 text-lg font-medium text-gray-900 title-font">
                  Speed up your daily workflow.
                </h3>
                <p className="text-base leading-relaxed">
                  Click on component ➡️ change code ➡️ check changes ➡️ and
                  repeat by clicking on another component 🔁
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
