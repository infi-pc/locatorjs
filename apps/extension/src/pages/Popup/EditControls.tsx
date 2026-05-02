import { For } from 'solid-js';
import { CloseButton, Switch } from '@hope-ui/solid';
import {
  modifiersTitles,
  getModifiersMap,
  getModifiersString,
} from '@locator/shared';
import { Page } from './Page';
import SectionHeadline from './SectionHeadline';
import { useSyncedState } from './syncedState';
import { ProvenanceBadge } from './ProvenanceBadge';

type Props = {
  setPage: (page: Page) => void;
};

export function EditControls(props: Props) {
  const { snapshot, setUserExtension } = useSyncedState();

  const modifiersString = () => snapshot()?.effective.mouseModifiers ?? 'alt';
  const modifiersMap = () => getModifiersMap(modifiersString());
  const modifiersProvenance = () => snapshot()?.provenance.mouseModifiers;
  const experimentalProvenance = () =>
    snapshot()?.provenance.experimentalFeatures;

  function setControl(key: string, enable: boolean) {
    const map = modifiersMap();
    if (enable) {
      map[key] = true;
    } else {
      delete map[key];
    }
    setUserExtension({ mouseModifiers: getModifiersString(map) });
  }

  return (
    <div class="flex justify-between">
      <div>
        <SectionHeadline>
          <span>Mouse-click modifiers</span>{' '}
          <ProvenanceBadge layer={modifiersProvenance()} />
        </SectionHeadline>
        <p>Modifier keys to enable "mouse click" and other shortcuts:</p>
        <div class="flex flex-col items-start gap-1 mt-2 flex-wrap mb-4">
          <For each={Object.entries(modifiersTitles)}>
            {([key, title]) => (
              <Switch
                size={'sm'}
                labelPlacement="end"
                onChange={(e: any) => {
                  setControl(key, e.currentTarget.checked);
                }}
                checked={!!modifiersMap()[key]}
              >
                {title}
              </Switch>
            )}
          </For>
        </div>

        <SectionHeadline>
          <span>Others</span>{' '}
          <ProvenanceBadge layer={experimentalProvenance()} />
        </SectionHeadline>
        <div class="flex flex-col gap-1 mb-2 items-start">
          <Switch
            size={'sm'}
            labelPlacement="end"
            onChange={(e: any) => {
              setUserExtension({
                experimentalFeatures: e.currentTarget.checked,
              });
            }}
            checked={!!snapshot()?.effective.experimentalFeatures}
          >
            Enable experimental features
          </Switch>
        </div>
      </div>
      <CloseButton
        onClick={() => {
          props.setPage({ type: 'home' });
        }}
      />
    </div>
  );
}
