import { LinkThatWorksWithOption } from "./LinkThatWorksWithOption";
import LogoIcon from "./LogoIcon";

export function NoLinkDialog() {
  return (
    <div class="bg-white p-4 rounded-xl border-2 border-red-500 shadow-xl cursor-auto pointer-events-auto z-10">
      <LogoIcon />

      <div class="mt-2 font-bold">No source info found for this element!</div>

      <div class="text-gray-700">
        <p class="font-medium text-gray-900 mt-2 mb-1">
          You need one of these:
        </p>
        <ul class="pl-4 list-disc">
          <li>
            Working React in development mode, with{" "}
            <LinkThatWorksWithOption href="https://babeljs.io/docs/en/babel-preset-react">
              preset-react plugins
            </LinkThatWorksWithOption>
          </li>
          <li>React, SolidJS or Preact with Locator Babel plugin</li>
        </ul>
        <p class="font-medium text-gray-900 mt-2 mb-1">Setup babel plugin:</p>
        <div>
          <ul class="pl-4 list-disc">
            <li>
              <LinkThatWorksWithOption href="https://www.locatorjs.com/install/react-data-id">
                React
              </LinkThatWorksWithOption>
            </li>
            <li>
              <LinkThatWorksWithOption href="https://www.locatorjs.com/install/preact">
                Preact
              </LinkThatWorksWithOption>
            </li>
            <li>
              <LinkThatWorksWithOption href="https://www.locatorjs.com/install/solidjs">
                SolidJS
              </LinkThatWorksWithOption>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
