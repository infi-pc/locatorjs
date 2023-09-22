import Link from "next/link";
import { ReactNode } from "react";

export function SetupLink({
  icon,
  title,
  text,
  id,
  experimental,
}: {
  icon: ReactNode;
  title: ReactNode;
  text?: ReactNode;
  id: string;
  experimental?: boolean;
}) {
  return (
    <div className="p-4">
      {/* eslint-disable-next-line @next/next/link-passhref */}
      <Link href={`/install/${id}`}>
        <div className="flex flex-col p-8 border-2 border-gray-200 border-opacity-50 rounded-lg cursor-pointer sm:flex-row hover:bg-slate-50">
          <div className="inline-flex items-center justify-center flex-shrink-0 w-16 h-16 mb-4 rounded-full sm:mr-8 sm:mb-0">
            {icon}
          </div>
          <div className="flex-grow">
            <h2 className="flex items-center mb-3 text-lg font-medium text-gray-900 title-font">
              {title}
              {experimental ? (
                <div className="text-sm inline-block px-2 py-0.5 ml-2 text-gray-600 rounded-full bg-slate-100">
                  experimental
                </div>
              ) : null}
            </h2>
            {text && <p className="mb-3 text-sm leading-relaxed">{text}</p>}
            <span className="inline-flex items-center text-indigo-500">
              See instructions
              <svg
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="w-4 h-4 ml-2"
                viewBox="0 0 24 24"
              >
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
