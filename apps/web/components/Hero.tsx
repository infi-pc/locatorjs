import Image from "next/image";
import React from "react";
import demo from "../public/demo2.gif";
import background from "../public/bg.svg";

function Hero() {
  return (
    <section className="text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900 ">
      <div className="container flex flex-col items-center px-5 py-24 mx-auto md:flex-row relative">
        <div className="absolute top-1/2 -right-0 md:w-8/12 md:-right-16 md:top-24 lg:-right-32 lg:top-10 xl:top-0 2xl:-top-10 opacity-20">
          <Image src={background} />
        </div>
        <div className="flex flex-col items-center mb-16 text-center lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 md:items-start md:text-left md:mb-0 ">
          <h1 className="mb-4 text-3xl text-gray-900 title-font sm:text-5xl lg:text-7xl dark:text-white font-bold">
            Find any component in code
          </h1>
          <p className="leading-relaxed">
            A plugin for you dev stack that allows you to click trough from your
            app to it's code.
          </p>
          <div className="text-xl font-bold mt-4">Try it here and now:</div>
          <div className="flex justify-center flex-col gap-3 mt-4 font-bold">
            <div>
              hold{" "}
              <span className="py-1 px-2 mx-1 border border-gray-300 rounded-md">
                ⌥ option
              </span>{" "}
              and click on component
            </div>
            <div>
              press{" "}
              <span className="py-1 px-2 mx-1 border border-gray-300 rounded-md">
                ⌥ option
              </span>{" "}
              +{" "}
              <span className="py-1 px-2 mx-1 border border-gray-300 rounded-md">
                D
              </span>{" "}
              to show UI
            </div>
          </div>
        </div>
        <div className="flex z-10 object-cover object-center w-5/6  md:w-1/2 shadow-2xl rounded-lg overflow-hidden">
          <Image
            className=""
            src={demo}
          ></Image>
        </div>
      </div>
    </section>
  );
}

export default Hero;
