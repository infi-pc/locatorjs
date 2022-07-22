import { useRouter } from "next/router";
import { ReactNode, useState } from "react";
import Header from "../../components/Header";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

export default function InstallFramework({}) {
  const router = useRouter();

  if (router.query.framework === "react") {
    return (
      <>
        <Header></Header>
        <section className="overflow-hidden text-gray-600 body-font dark:text-gray-400 dark:bg-gray-900">
          <div className="container flex flex-col items-center justify-center py-24 mx-auto">
            <h3 className="mb-4 text-2xl font-medium text-center text-gray-900 font-display sm:text-5xl title-font dark:text-white">
              Install React
            </h3>
            <p className="text-center">You will need one or two things.</p>
            <div className="max-w-screen-sm p-8 m-8 border border-gray-300 rounded-xl">
              <div className="flex gap-4 mb-4">
                <Step no={1} />
                <div className="mt-2">
                  <h2 className="mb-3 text-lg font-medium text-gray-900 title-font">
                    Add Babel plugin
                  </h2>
                  You need a babel plugin to gather all the component's
                  locations in their files.
                  <Tabs
                    items={[
                      {
                        title: "Next.js",
                        content: (
                          <>
                            In{" "}
                            <code className="px-2 py-1 rounded bg-slate-100">
                              pages/_app.tsx
                            </code>{" "}
                            (or other global file) add:
                            <SyntaxHighlighter
                              language="javascript"
                              style={a11yDark}
                            >
                              {`import setupLocatorUI from "@locator/runtime";
                              
setupLocatorUI();`}
                            </SyntaxHighlighter>
                          </>
                        ),
                      },
                      {
                        title: "Create React App",
                        content: "x",
                      },
                      {
                        title: "Vite",
                        content: "x",
                      },
                      {
                        title: "Babel",
                        content: "x",
                      },
                      {
                        title: "Webpack",
                        content: "x",
                      },
                    ]}
                  />
                </div>
              </div>
              <div className="flex gap-4 mb-4">
                <Step no={2} />
                <div className="mt-2">
                  <h2 className="mb-3 text-lg font-medium text-gray-900 title-font">
                    Add UI library
                  </h2>
                  <div>
                    Call this one function to show the components and handle the
                    clickings.
                    <div></div>
                    <div
                      className="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-200 dark:text-blue-800"
                      role="alert"
                    >
                      Alternatively install <b>Browser Extension</b> - if you
                      are not ready to show the UI to your whole team, you can
                      skip installing library. Browser extension will connect to
                      apps that have Locator Babel Plugin installed.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }
  return <div>{router.query.framework} is not implemented yet</div>;
}

function Step({ no }: { no: number }) {
  return (
    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 mb-5 text-xl text-indigo-500 bg-indigo-100 rounded-full">
      {no}
    </div>
  );
}

function Tabs({ items }: { items: { title: string; content: ReactNode }[] }) {
  const [selected, setSelected] = useState(items[0]);
  const selectedItem = items.filter(({ title }) => selected.title === title)[0];
  return (
    <>
      <div className="mt-4 mb-4 text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px">
          {items.map((item, index) => (
            <li className="mr-1">
              <a
                className={
                  item.title === selected.title
                    ? "inline-block p-2 text-blue-600 rounded-t-lg border-b-2 border-blue-600 active dark:text-blue-500 dark:border-blue-500"
                    : "inline-block p-2 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 cursor-pointer"
                }
                onClick={() => {
                  setSelected(item);
                }}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
      {selectedItem.content}
    </>
  );
}
