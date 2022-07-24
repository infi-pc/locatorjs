import { Editor } from './Editor';
import { Button, Kbd } from '@hope-ui/solid';
import { HiSolidCog } from 'solid-icons/hi';
import { modifiersTitles } from '@locator/shared';
import { useSyncedState } from './syncedState';
import { Page } from './Page';
import SectionHeadline from './SectionHeadline';

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
