import { Editor } from './Editor';
import { Button, Kbd } from '@hope-ui/solid';
import { HiSolidCog } from 'solid-icons/hi';
import { modifiersTitles } from '@locator/shared';
import { useSyncedState } from './syncedState';
import { Page } from './Page';
import SectionHeadline from './SectionHeadline';
import { requestEnable } from './requestEnable';

type Props = {
  setPage: (page: Page) => void;
};

export function Home(props: Props) {
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
          {/* <div class="py-1 text-sm">
            <b>
              <Modifiers /> + <Kbd>D</Kbd>
            </b>{' '}
            toggle select mode
          </div> */}
          <p class="text-xs leading-5 text-gray-800 dark:text-gray-200">
            remember to <b>focus your app</b> (click on any surface)
          </p>
        </div>
        <div class="absolute right-4">
          <Button
            colorScheme="neutral"
            variant="subtle"
            size="xs"
            class="gap-1"
            onClick={() => {
              props.setPage({ type: 'edit-controls' });
            }}
          >
            <HiSolidCog /> settings
          </Button>
        </div>
      </div>
      <Editor />

      <div class="mt-2 w-full flex justify-between items-center">
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
          onClick={() => {
            requestEnable(false);
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
  const { controls } = useSyncedState();
  return (
    <>
      {Object.keys(controls.getMap()).map((key, i) => {
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
