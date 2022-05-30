import { Editor } from './Editor';
import { Button } from '@hope-ui/solid';
import { HiSolidCog } from 'solid-icons/hi';
import { altTitle } from './Popup';
import { controlsMap } from './controls';
import { modifiersTitles } from '@locator/shared';

type Props = {
  setPage: (page: 'home' | 'edit-controls') => void;
};

export function Home({ setPage }: Props) {
  return (
    <>
      <div class="flex justify-between">
        <div>
          <label class="text-lg font-medium text-gray-900 mb-4">
            Controls:{' '}
          </label>

          <div class="locatorjs-line">
            <b>
              <Modifiers /> +{' '}
              <span class="locatorjs-key">
                <svg
                  viewBox="0 0 24 24"
                  style={{
                    width: '14px',
                    height: '14px',
                    display: 'inline-block',
                  }}
                >
                  <path
                    fill="currentColor"
                    d="M11,1.07C7.05,1.56 4,4.92 4,9H11M4,15A8,8 0 0,0 12,23A8,8 0 0,0 20,15V11H4M13,1.07V9H20C20,4.92 16.94,1.56 13,1.07Z"
                  />
                </svg>{' '}
                click
              </span>
            </b>{' '}
            go to editor
          </div>
          <div class="locatorjs-line">
            <b>
              <Modifiers /> + <span class="locatorjs-key">D</span>
            </b>{' '}
            toggle select mode
          </div>
          <p class="text-xs leading-5 text-gray-800">
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
              setPage('edit-controls');
            }}
          >
            <HiSolidCog /> edit controls
          </Button>
        </div>
      </div>
      <Editor />
    </>
  );
}

function Modifiers() {
  return (
    <>
      {Object.keys(controlsMap()).map((key, i) => {
        return (
          <>
            {i === 0 ? '' : ' + '}
            <span class="locatorjs-key">
              {modifiersTitles[key as keyof typeof modifiersTitles]}
            </span>
          </>
        );
      })}
    </>
  );
}
