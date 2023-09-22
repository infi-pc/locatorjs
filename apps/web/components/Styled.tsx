import tw from "tailwind-styled-components";

export const StepsBody = tw.div`pt-8 sm:p-8 sm:m-8 sm:border sm:border-gray-300 sm:rounded-xl max-w-full sm:max-w-screen-sm`;

export const BlockHeadline = tw.h1`mb-4 text-2xl font-medium text-center text-gray-900 font-display sm:text-5xl title-font dark:text-white`;

export const InlineCode = tw.span`px-2 py-1 rounded bg-slate-100`;

export const StandardLink = tw.a`text-blue-600 hover:text-blue-700 underline cursor-pointer`;

export const Alert = tw.div`p-4 mt-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-200 dark:text-blue-800`;
export const AlertWarning = tw.div`p-4 mt-4 mb-4 text-sm text-orange-700 bg-orange-100 rounded-lg dark:bg-orange-200 dark:text-orange-800`;

export const InstallContainer = tw.div`container flex flex-col items-center justify-center px-4 py-24 mx-auto`;
