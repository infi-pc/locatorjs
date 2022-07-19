export default function SetupLinks() {
  return (
    <section className="overflow-hidden text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container py-24 mx-auto ">
        <h3 className="mb-4 text-2xl font-medium text-center text-gray-900 font-display sm:text-5xl title-font dark:text-white">
          Setup
        </h3>
        <p className="text-center">???</p>
        <div className="flex flex-col items-center justify-center gap-4 p-4 mt-4 sm:flex-row">
          - React (Devtools based) - works with Next, CRA, Vite and others* - *
          any modern stack that has react-preset-env and correctly set-up
          development - Install Browser extension - (alternatively set it-up for
          your team) - React (data-id based) - works with others 1. Babel Plugin
          1. Vite 2. CRA 3. Nextjs 4. Babel config 2. Install library
          Alternatively Install Extension - if you are not ready to show the UI
          to your whole team. you can skip installing library, Browser extension
          will connect to apps that have Locator Babel Plugin installed.
        </div>
      </div>
    </section>
  );
}
