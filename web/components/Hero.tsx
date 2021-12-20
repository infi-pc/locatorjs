import Image from "next/image";
import React from "react";
import intro from "../../docs/intro.gif";
import background from "../public/bg.svg";

function Hero() {
  return (
    <section className="text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900 ">
      <div className="container flex flex-col items-center px-5 py-24 mx-auto md:flex-row relative">
        <div className="absolute -right-32 -top-10">
          <Image src={background} />
        </div>
        <div className="flex flex-col items-center mb-16 text-center lg:flex-grow md:w-1/2 lg:pr-24 md:pr-16 md:items-start md:text-left md:mb-0 ">
          <h1 className="mb-4 text-3xl font-medium text-gray-900 title-font sm:text-4xl dark:text-white">
            Find any component in code ASAP
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
        <div className="w-5/6  md:w-1/2">
          <Image
            className="object-cover object-center rounded"
            src={intro}
          ></Image>
        </div>
      </div>
    </section>
  );
}

export default Hero;
