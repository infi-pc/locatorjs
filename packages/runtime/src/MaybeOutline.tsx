import { createMemo, JSXElement } from "solid-js";
import { AdapterObject } from "./adapters/adapterApi";
import LogoIcon from "./LogoIcon";
import { Outline } from "./Outline";

export function MaybeOutline(props: {
  currentElement: HTMLElement;
  showTreeFromElement: (element: HTMLElement) => void;
  adapter: AdapterObject;
}) {
  const elInfo = createMemo(() =>
    props.adapter.getElementInfo(props.currentElement)
  );
  return (
    <>
      {elInfo() ? (
        <Outline
          element={elInfo()!}
          showTreeFromElement={props.showTreeFromElement}
        />
      ) : (
        <div class="fixed top-0 left-0 w-screen h-screen flex items-center justify-center cursor-auto pointer-events-auto">
          <div class="bg-white p-4 rounded-xl border-2 border-red-500 shadow-xl">
            <LogoIcon />

            <div class="mt-2 font-bold">
              No source info found for this element!
            </div>

            <div class="text-gray-700">
              <p class="font-medium text-gray-900 mt-2 mb-1">
                You need one of these:
              </p>
              <ul class="pl-4 list-disc">
                <li>
                  Working React in development mode, with{" "}
                  <LinkMaybe href="https://babeljs.io/docs/en/babel-preset-react">
                    preset-react plugins
                  </LinkMaybe>
                </li>
                <li>React, SolidJS or Preact with Locator Babel plugin</li>
              </ul>
              <p class="font-medium text-gray-900 mt-2 mb-1">
                Setup babel plugin:
              </p>
              <div>
                <ul class="pl-4 list-disc">
                  <li>
                    <LinkMaybe href="https://www.locatorjs.com/install/react-data-id">
                      React
                    </LinkMaybe>
                  </li>
                  <li>
                    <LinkMaybe href="https://www.locatorjs.com/install/preact">
                      Preact
                    </LinkMaybe>
                  </li>
                  <li>
                    <LinkMaybe href="https://www.locatorjs.com/install/solidjs">
                      SolidJS
                    </LinkMaybe>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function LinkMaybe(props: { href: string; children: JSXElement }) {
  return (
    <a
      href={props.href}
      target="_blank"
      class="underline"
      onClick={(e) => {
        e.preventDefault();
        window.open(props.href, "_blank");
      }}
    >
      {props.children}
    </a>
  );
}
