import { Input, Radio } from '@hope-ui/solid';
import { allTargets } from '@locator/shared';
import { createEffect, createSignal } from 'solid-js';
import browser from '../../browser';

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
        <div class="flex flex-col">
          {Object.entries(allTargets).map(([key, { label, url }]) => (
            <Radio
              checked={key === target()}
              onChange={() => {
                changeTarget(key);
              }}
            >
              {label}
            </Radio>
          ))}
          <Radio
            checked={allTargets[target()] === undefined}
            onChange={() => {
              if (allTargets[target()]) {
                changeTarget(allTargets[target()].url);
              }
              input?.focus();
              input?.select();
            }}
          >
            Custom link
          </Radio>
        </div>
      </fieldset>
      <div class="mt-2 pb-4">
        <Input
          placeholder="Basic usage"
          ref={input}
          value={allTargets[target()] ? allTargets[target()].url : target()}
          onInput={(e) => changeTarget(e.currentTarget.value)}
          type="text"
          name="link"
          id="link"
          disabled={!!allTargets[target()]}
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
