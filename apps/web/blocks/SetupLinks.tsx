import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

export default function SetupLinks() {
  return (
    <section className="overflow-hidden text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container py-24 mx-auto ">
        <h3 className="mb-4 text-2xl font-medium text-center text-gray-900 font-display sm:text-5xl title-font dark:text-white">
          Setup
        </h3>
        <p className="text-center">Select your framework</p>

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
            title="React (devtools based)"
            text="Works with most React dev stacks like Vite, Next.js, or Create React App. No need to install any packages."
            id="react"
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
            title="React (data-id based)"
            text="For other types of React projects or if you want to use it on production-like environments."
            id="react-data-id"
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
        </div>
      </div>
    </section>
  );
}

function SetupLink({
  icon,
  title,
  text,
  id,
}: {
  icon: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  id: string;
}) {
  return (
    <div className="p-4">
      <Link href={`/install/${id}`}>
        <div className="flex flex-col p-8 border-2 border-gray-200 border-opacity-50 rounded-lg cursor-pointer sm:flex-row hover:bg-slate-50">
          <div className="inline-flex items-center justify-center flex-shrink-0 w-16 h-16 mb-4 rounded-full sm:mr-8 sm:mb-0">
            {icon}
          </div>
          <div className="flex-grow">
            <h2 className="mb-3 text-lg font-medium text-gray-900 title-font">
              {title}
            </h2>
            {text && <p className="mb-3 text-sm leading-relaxed">{text}</p>}
            <a className="inline-flex items-center text-indigo-500">
              See instructions
              <svg
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                className="w-4 h-4 ml-2"
                viewBox="0 0 24 24"
              >
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>
        </div>
      </Link>
    </div>
  );
}
