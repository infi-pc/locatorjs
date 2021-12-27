import Image from "next/image";
import React from "react";
import logo from "../public/logo-noborders3x.png";
import GitHubButton from "react-next-github-btn";

function Header() {
  return (
    <header className="text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container flex flex-col flex-wrap items-center p-5 mx-auto md:flex-row">
        <a
          href="/"
          className="mb-4 md:mb-0"
        >
          <Image
            unoptimized={true}
            src={logo}
            height={50}
            width={207}
            alt="LocatorJS logo"
          ></Image>
        </a>
        <nav className="flex flex-wrap items-center justify-center text-base md:ml-auto">
          {/* <a href="" className="mr-5 hover:text-gray-900 dark:hover:text-white">
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
          </a> */}
          <div className="mt-1">
            <GitHubButton
              href="https://github.com/infi-pc/locatorjs"
              data-icon="octicon-star"
              data-size="large"
              aria-label="Star infi-pc/locatorjs on GitHub"
            >
              Star
            </GitHubButton>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Header;
