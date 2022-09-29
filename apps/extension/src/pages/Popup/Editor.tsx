import { For } from 'solid-js';
import { Button, Input, Radio } from '@hope-ui/solid';
import { allTargets } from '@locator/shared';
import SectionHeadline from './SectionHeadline';
import { useSyncedState } from './syncedState';

export function Editor() {
  let input: HTMLInputElement | undefined;
  const { target } = useSyncedState();

  return (
    <div class="mt-2">
      <SectionHeadline>
        Editor link: <span class="text-gray-500">(for all projects)</span>
      </SectionHeadline>
      <p class="text-sm leading-5 text-gray-500" />
      <fieldset class="mt-2">
        <legend class="sr-only">Notification method</legend>
        <div class="flex flex-col">
          <For each={Object.entries(allTargets)}>
            {([key, { label }]) => (
              <div class="flex justify-between">
                <Radio
                  checked={key === target.get()}
                  onChange={() => {
                    target.set(key);
                  }}
                >
                  {label}
                </Radio>
                {key === 'vscode' && target.get() === 'vscode' && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      target.set(
                        allTargets['vscode'].url.replace(
                          'vscode://',
                          'vscode-insiders://'
                        )
                      );
                    }}
                  >
                    (switch to VSCode insiders)
                  </Button>
                )}
              </div>
            )}
          </For>
          <Radio
            checked={allTargets[target.get()] === undefined}
            onChange={() => {
              if (allTargets[target.get()]) {
                target.set(allTargets[target.get()].url);
              }
              input?.focus();
              input?.select();
            }}
          >
            Custom link
          </Radio>
        </div>
      </fieldset>
      <div class="mt-2 pb-2">
        <Input
          placeholder="Basic usage"
          ref={input}
          value={
            allTargets[target.get()]
              ? allTargets[target.get()].url
              : target.get()
          }
          onInput={(e) => target.set(e.currentTarget.value)}
          type="text"
          name="link"
          id="link"
          class={
            allTargets[target.get()] ? 'text-gray-400 focus:text-gray-800' : ''
          }
        />

        {!allTargets[target.get()] ? (
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
