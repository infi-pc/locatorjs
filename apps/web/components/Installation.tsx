import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import { MdOutlineArrowForward } from "react-icons/md";
import Headline from "./Headline";

function Installation() {
  return (
    <section className="overflow-hidden text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container px-5 py-24 mx-auto">
        <div className="flex flex-col w-full mb-20 text-center">
          <Headline size="3xl" className="mb-2 sm:text-4xl">
            Two projects, one core.
          </Headline>
          <p>LocatorJS comes in two variants. So what variant to choose?</p>
        </div>
        <div className="flex flex-wrap justify-center -m-4">
          <div className="w-full p-4 xl:w-1/4 md:w-1/2">
            <div className="relative flex flex-col h-full p-6 overflow-hidden border-2 rounded-lg border-primary-500">
              <span className="absolute top-0 right-0 px-3 py-1 text-xs tracking-widest text-white rounded-bl bg-primary-500">
                Good to start with
              </span>
              <h2 className="mb-1 text-sm font-medium tracking-widest title-font dark:text-gray-400">
                Good for devs
              </h2>
              <h1 className="flex items-center pb-4 mb-4 text-2xl leading-none text-gray-900 border-b border-gray-200 dark:text-white dark:border-gray-800">
                Browser Extension
              </h1>
              <p className="flex items-center mb-2 text-gray-600 dark:text-gray-400">
                <span className="mr-2 text-gray-400 dark:text-gray-800">
                  <FaCheckCircle />
                </span>
                Easy to setup
              </p>
              <p className="flex items-center mb-2 text-gray-600 dark:text-gray-400">
                <span className="mr-2 text-gray-400 dark:text-gray-800">
                  <FaCheckCircle />
                </span>
                No need to modify build steps
              </p>

              <a
                href="https://chrome.google.com/webstore/detail/locatorjs/npbfdllefekhdplbkdigpncggmojpefi"
                className="flex items-center w-full px-4 py-2 mt-auto text-white border-0 rounded bg-primary-500 focus:outline-none hover:bg-primary-600"
              >
                Get Chrome Extension
                <MdOutlineArrowForward className="ml-1 text-xl" />
              </a>
            </div>
          </div>
          <div className="w-full p-4 xl:w-1/4 md:w-1/2">
            <div className="relative flex flex-col h-full p-6 overflow-hidden border-2 border-gray-300 rounded-lg dark:border-gray-700">
              <h2 className="mb-1 text-sm font-medium tracking-widest title-font dark:text-gray-400">
                Good for teams
              </h2>
              <h1 className="flex items-center pb-4 mb-4 text-2xl leading-none text-gray-900 border-b border-gray-200 dark:text-white dark:border-gray-800">
                Library / Devstack plugin
              </h1>
              <p className="flex items-center mb-2 text-gray-600 dark:text-gray-400">
                <span className="mr-2 text-gray-400 dark:text-gray-800">
                  <FaCheckCircle />
                </span>
                Setup once for whole team
              </p>
              <p className="flex items-center mb-2 text-gray-600 dark:text-gray-400">
                <span className="mr-2 text-gray-400 dark:text-gray-800">
                  <FaCheckCircle />
                </span>
                Works in all browsers
              </p>
              <p className="flex items-center mb-2 text-gray-600 dark:text-gray-400">
                <span className="mr-2 text-gray-400 dark:text-gray-800">
                  <FaCheckCircle />
                </span>
                More precise targeting
              </p>

              <a
                href="https://github.com/infi-pc/locatorjs/blob/master/readme-library.md"
                className="flex items-center w-full px-4 py-2 mt-6 text-white bg-gray-400 border-0 rounded focus:outline-none hover:bg-gray-500 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                Go To Setup Instruction
                <MdOutlineArrowForward className="ml-1 text-xl" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Installation;
