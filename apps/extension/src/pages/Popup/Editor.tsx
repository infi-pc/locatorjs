import { allTargets } from '@locator/shared';
import { createEffect, createSignal } from 'solid-js';

export function Editor() {
  const [target, setTarget] = createSignal<string>('vscode');

  function changeTarget(newTarget: string) {
    setTarget(newTarget);
    // localStorage.setItem('target', newTarget);

    browser.storage.local.set({ target: newTarget }, function () {
      console.log('Value is set to ' + newTarget);
    });
  }

  // TODO make it sync, as soon as we get a firefox id
  browser.storage.local
    .get(['target'])
    .then((result) => {
      if (typeof result?.target === 'string') {
        setTarget(result.target);
      }
    })
    .catch((e) => {
      console.error(e);
    });

  // console.log(allTargets[target()] ? allTargets[target()].url : target());

  // createEffect(() => {
  //   console.log(allTargets[target()] ? allTargets[target()].url : target());
  // });

  let input: HTMLInputElement | undefined;

  return (
    <div class="mt-2">
      <label class="text-lg font-medium text-gray-900 mb-3">Editor link:</label>
      <p class="text-sm leading-5 text-gray-500"></p>
      <fieldset class="mt-2">
        <legend class="sr-only">Notification method</legend>
        <div class="space-y-2">
          {Object.entries(allTargets).map(([key, { label, url }]) => (
            <div class="flex items-center">
              <input
                id={key}
                name="notification-method"
                type="radio"
                checked={key === target()}
                onChange={() => {
                  changeTarget(key);
                }}
                class="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <label
                htmlFor={key}
                class="block ml-3 text-sm font-medium text-gray-700"
              >
                {label}
              </label>
            </div>
          ))}
          <div class="flex items-center">
            <input
              id={'other'}
              name="notification-method"
              type="radio"
              checked={allTargets[target()] === undefined}
              class="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              onChange={() => {
                if (allTargets[target()]) {
                  changeTarget(allTargets[target()].url);
                }
                input?.focus();
                input?.select();
              }}
            />
            <label
              htmlFor={'other'}
              class="block ml-3 text-sm font-medium text-gray-700"
            >
              Custom link
            </label>
          </div>
        </div>
      </fieldset>
      <div class="mt-2 pb-4">
        <label htmlFor="link" class="sr-only">
          Link
        </label>
        <input
          ref={input}
          value={allTargets[target()] ? allTargets[target()].url : target()}
          onInput={(e) => changeTarget(e.currentTarget.value)}
          type="text"
          name="link"
          id="link"
          class={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            allTargets[target()] ? 'text-gray-500' : ''
          }`}
        />
        {!allTargets[target()] ? (
          <div class="text-gray-500 mt-1">
            Available variables: {`projectPath, filePath, line, column`}
          </div>
        ) : (
          ''
        )}
      </div>
    </div>
  );
}
