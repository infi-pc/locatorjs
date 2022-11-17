import Image from "next/image";
import React from "react";
import logo from "../public/logo-noborders3x.png";
import { FaChrome, FaFirefox, FaGithub } from "react-icons/fa";
import { extensionLink, useBrowser } from "./shared";

function Header() {
  const browser = useBrowser();
  return (
    <header className="text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container flex flex-col flex-wrap items-center p-5 mx-auto md:flex-row">
        <a href="/" className="mb-4 md:mb-0">
          <Image
            unoptimized={true}
            src={logo}
            height={50}
            width={207}
            alt="LocatorJS logo"
          ></Image>
        </a>
        <nav className="flex flex-wrap items-center justify-center gap-2 text-base md:ml-auto">
          <a
            href={
              browser === "firefox"
                ? extensionLink.firefox
                : extensionLink.chrome
            }
            className="flex items-center gap-1 px-3 py-1 text-base border-0 rounded bg-slate-100 focus:outline-none hover:bg-slate-200"
          >
            {browser === "firefox" ? (
              <FaFirefox></FaFirefox>
            ) : (
              <FaChrome></FaChrome>
            )}{" "}
            Get Extension
          </a>

          <a
            href="https://github.com/infi-pc/locatorjs"
            className="flex items-center gap-1 px-3 py-1 text-base border-0 rounded bg-slate-100 focus:outline-none hover:bg-slate-200"
          >
            <FaGithub></FaGithub> GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Header;
