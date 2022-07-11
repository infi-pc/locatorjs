export default function Faq() {
  return (
    <section className="overflow-hidden text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
      <div className="container py-24 mx-auto ">
        <h3 className="mb-4 text-2xl font-medium text-center text-gray-900 font-display sm:text-5xl title-font dark:text-white">
          FAQ
        </h3>
        <p className="text-center">???</p>
        <div className="flex flex-col items-center justify-center gap-4 p-4 mt-4 sm:flex-row">
          What is the right name? Preffered format is LocatorJS or just Locator.
          Locator.js, Locator JS, locatorjs are weird. Do I need to install
          anything to my project? In most dev stacks as CRA, Next.js or Vite,
          you don't need to install anything, the browser extension is enough.
          If you use some custom config (for example custorm webpack)
        </div>
      </div>
    </section>
  );
}
