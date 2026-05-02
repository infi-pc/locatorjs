import { For } from 'solid-js';
import { Button, Input, Radio } from '@hope-ui/solid';
import { allTargets } from '@locator/shared';
import SectionHeadline from './SectionHeadline';
import { useSyncedState } from './syncedState';
import { ProvenanceBadge } from './ProvenanceBadge';
import { SiteLocalToggle } from './SiteLocalToggle';

export function Editor() {
  let input: HTMLInputElement | undefined;
  const { snapshot, setUserExtension, setSiteLocal } = useSyncedState();

  const availableTargets = () => snapshot()?.allTargets ?? allTargets;
  const selectedTargetId = () => {
    const s = snapshot();
    return s?.effective.targetTemplate ?? s?.effective.targetId ?? '';
  };
  const targetProvenance = () =>
    snapshot()?.provenance.targetTemplate ?? snapshot()?.provenance.targetId;

  function selectTarget(
    val: string,
    scope: 'extension' | 'site' = 'extension'
  ) {
    const setter = scope === 'site' ? setSiteLocal : setUserExtension;
    if (val.includes('://')) {
      setter({ targetTemplate: val, targetId: undefined });
    } else {
      setter({ targetId: val, targetTemplate: undefined });
    }
  }

  return (
    <div class="mt-2">
      <SectionHeadline>
        <span>Editor link</span> <ProvenanceBadge layer={targetProvenance()} />
      </SectionHeadline>
      <fieldset class="mt-2">
        <legend class="sr-only">Editor</legend>
        <div class="flex flex-col">
          <For each={Object.entries(availableTargets())}>
            {([key, { label }]) => (
              <div class="flex justify-between items-center">
                <Radio
                  checked={key === selectedTargetId()}
                  onChange={() => selectTarget(key)}
                >
                  {label}
                </Radio>
                {key === 'vscode' && selectedTargetId() === 'vscode' && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      selectTarget(
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
            checked={availableTargets()[selectedTargetId()] === undefined}
            onChange={() => {
              const current = selectedTargetId();
              const known = availableTargets()[current];
              if (known) {
                selectTarget(known.url);
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
            availableTargets()[selectedTargetId()]
              ? availableTargets()[selectedTargetId()].url
              : selectedTargetId()
          }
          onInput={(e) => selectTarget(e.currentTarget.value)}
          type="text"
          name="link"
          id="link"
          class={
            availableTargets()[selectedTargetId()]
              ? 'text-gray-400 focus:text-gray-800'
              : ''
          }
        />

        {!availableTargets()[selectedTargetId()] ? (
          <div class="text-gray-500 mt-1">
            Available variables: {`projectPath, filePath, line, column`}
          </div>
        ) : (
          ''
        )}
      </div>
      <SiteLocalToggle
        label="Apply this editor only to this site"
        onSiteLocal={() => selectTarget(selectedTargetId(), 'site')}
        disabled={!snapshot()}
      />
    </div>
  );
}
