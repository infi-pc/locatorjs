"use client";

import Image from "next/image";
import { SetupLink } from "./SetupLink";
import { useState } from "react";

export default function SetupLinks() {
  const [copied, setCopied] = useState(false);

  const handleCopyPrompt = () => {
    const prompt = "Setup locatorjs, check locatorjs.com for instructions";
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCursorImplement = () => {
    const prompt = "Setup locatorjs, check locatorjs.com for instructions";
    const url = new URL("cursor://anysphere.cursor-deeplink/prompt");
    url.searchParams.set("text", prompt);
    window.open(url.toString(), "_blank");
  };

  return (
    <section className="overflow-hidden text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container py-24 mx-auto ">
        <h3 className="mb-4 text-2xl font-medium text-center text-gray-900 font-display sm:text-5xl title-font dark:text-white">
          Setup
        </h3>
        <p className="text-center mb-6">Select your framework</p>

        <div className="flex justify-center gap-3 mb-8">
          <button
            onClick={handleCursorImplement}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Image
              src="/logos/cursor.webp"
              alt="Cursor"
              width={16}
              height={16}
              className="mr-2"
            />
            Implement using Cursor
          </button>

          <button
            onClick={handleCopyPrompt}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              copied
                ? "text-green-700 bg-green-50 border border-green-300"
                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {copied ? (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path>
                </svg>
                Get installation prompt
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2">
          <SetupLink
            icon={
              <Image
                src="/logos/react.png"
                alt="React"
                width={100}
                height={85}
              />
            }
            title={
              <span>
                React <span className="text-gray-600"> (data-id approach)</span>
              </span>
            }
            text={
              <span className="text-xs">
                <b>Compared to devtools approach:</b> <br />
                Works with all React projects that use Babel, Webpack or
                Turbopack <br />
                It can be used also in production-like environments. <br />
                Contains additional support for styled-components.
              </span>
            }
            id="react-data-id"
          />
          <SetupLink
            icon={
              <Image
                src="/logos/react.png"
                alt="React"
                width={100}
                height={85}
              />
            }
            title={
              <span>
                React{" "}
                <span className="text-gray-600"> (devtools approach)</span>
              </span>
            }
            text={
              <span className="text-xs">
                <b>Compared to data-id approach:</b> <br />
                Works with Vite or Create React App. <br />
                Does not work with Next.js <br />
                If you use the Browser extension, you don{"'"}t need to install
                any packages. <br />
                You might need to have React DevTools to make it working
                properly.
              </span>
            }
            id="react"
          />
          <SetupLink
            icon={
              <Image
                src="/logos/solidjs.svg"
                alt="SolidJS"
                width={100}
                height={100}
              />
            }
            title="SolidJS"
            id="solidjs"
          />
          <SetupLink
            icon={
              <Image
                src="/logos/preact.png"
                alt="Preact"
                width={100}
                height={100}
              />
            }
            title="Preact"
            id="preact"
          />
          <SetupLink
            icon={
              <Image
                src="/logos/svelte.png"
                alt="Svelte"
                width={85}
                height={100}
              />
            }
            title="Svelte"
            id="svelte"
            experimental
          />
          <SetupLink
            icon={
              <Image src="/logos/vue.svg" alt="Vue" width={85} height={100} />
            }
            title="Vue"
            id="vue"
            experimental
          />
        </div>
      </div>
    </section>
  );
}
