import { Settings } from 'lucide-solid';
import { modifiersTitles, getModifiersMap } from '@locator/shared';
import { Button, Kbd, ProvenanceBadge, SectionHeadline } from '@locator/ui';
import { useSyncedState } from './syncedState';
import { Page } from './Page';

type Props = {
  setPage: (page: Page) => void;
};

export function Home(props: Props) {
  const { setSiteLocal, snapshot } = useSyncedState();

  const targetProvenance = () =>
    snapshot()?.provenance.targetTemplate ?? snapshot()?.provenance.targetId;
  const currentEditor = () => {
    const s = snapshot();
    if (!s) return undefined;
    const selected = s.effective.targetTemplate ?? s.effective.targetId;
    if (selected && s.allTargets[selected]) return s.allTargets[selected].label;
    return selected;
  };

  return (
    <>
      <div class="flex justify-between">
        <div>
          <SectionHeadline>Controls: </SectionHeadline>

          <div class="py-1 text-sm">
            <b>
              <Modifiers /> +{' '}
              <Kbd>
                <svg
                  viewBox="0 0 24 24"
                  style={{
                    width: '10px',
                    height: '10px',
                    display: 'inline-block',
                  }}
                >
                  <path
                    fill="currentColor"
                    d="M11,1.07C7.05,1.56 4,4.92 4,9H11M4,15A8,8 0 0,0 12,23A8,8 0 0,0 20,15V11H4M13,1.07V9H20C20,4.92 16.94,1.56 13,1.07Z"
                  />
                </svg>{' '}
                click
              </Kbd>
            </b>{' '}
            go to editor
          </div>
          <p class="text-xs leading-5 text-gray-800 dark:text-gray-200">
            remember to <b>focus your app</b> (click on any surface)
          </p>
        </div>
        <div class="absolute right-4">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              props.setPage({ type: 'settings' });
            }}
          >
            <Settings size={16} /> settings
          </Button>
        </div>
      </div>

      <div class="mt-3 flex items-center justify-between rounded bg-gray-50 px-3 py-2 dark:bg-gray-800">
        <div class="text-sm text-gray-800 dark:text-gray-200">
          Editor: <b>{currentEditor() ?? '—'}</b>{' '}
          <ProvenanceBadge layer={targetProvenance()} />
        </div>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => props.setPage({ type: 'settings' })}
        >
          change
        </Button>
      </div>

      <div class="mt-4 w-full flex justify-between items-center">
        <div>
          Support me on{' '}
          <a
            class="underline hover:text-sky-900 text-sky-700"
            href="https://github.com/sponsors/infi-pc"
            target="_blank"
          >
            GitHub sponsors
          </a>
        </div>
        <button
          class="bg-gray-50 text-gray-800 py-1 px-2 rounded hover:bg-red-200 active:bg-red-100 cursor-pointer text-xs hover:text-red-800 flex gap-1"
          disabled={!snapshot()}
          onClick={() => {
            setSiteLocal({ disabled: true });
          }}
        >
          <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M16.56,5.44L15.11,6.89C16.84,7.94 18,9.83 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12C6,9.83 7.16,7.94 8.88,6.88L7.44,5.44C5.36,6.88 4,9.28 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12C20,9.28 18.64,6.88 16.56,5.44M13,3H11V13H13"
            />
          </svg>{' '}
          Disable on this page
        </button>
      </div>
    </>
  );
}

function Modifiers() {
  const { snapshot } = useSyncedState();
  const map = () =>
    getModifiersMap(snapshot()?.effective.mouseModifiers ?? 'alt');
  return (
    <>
      {Object.keys(map()).map((key, i) => {
        return (
          <>
            {i === 0 ? '' : ' + '}
            <Kbd>{modifiersTitles[key as keyof typeof modifiersTitles]}</Kbd>
          </>
        );
      })}
    </>
  );
}
