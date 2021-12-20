import Image from "next/image";
import React from "react";
import logo from "../public/logo-noborders3x.png";

function Header() {
  return (
    <header className="text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container flex flex-col flex-wrap items-center p-5 mx-auto md:flex-row">
        <a
          href=""
          className="flex items-center mb-4 font-medium text-gray-900 title-font md:mb-0 dark:text-white"
        >
          <Image src={logo} height={66} width={276} alt="LocatorJS logo"></Image>
        </a>
        <nav className="flex flex-wrap items-center justify-center text-base md:ml-auto">
          <a href="" className="mr-5 hover:text-gray-900 dark:hover:text-white">
            First Link
          </a>
          <a href="" className="mr-5 hover:text-gray-900 dark:hover:text-white">
            Second Link
          </a>
          <a href="" className="mr-5 hover:text-gray-900 dark:hover:text-white">
            Third Link
          </a>
          <a href="" className="mr-5 hover:text-gray-900 dark:hover:text-white">
            Fourth Link
          </a>
        </nav>
        <button className="inline-flex items-center px-3 py-1 mt-4 text-base bg-gray-100 border-0 rounded focus:outline-none hover:bg-gray-200 md:mt-0 dark:bg-gray-800 dark:hover:bg-gray-700">
          Button
          <svg
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="w-4 h-4 ml-1"
            viewBox="0 0 24 24"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export default Header;
