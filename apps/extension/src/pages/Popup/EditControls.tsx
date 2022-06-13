import { CloseButton, IconButton, Switch } from '@hope-ui/solid';
import { modifiersTitles } from '@locator/shared';
import { HiSolidX } from 'solid-icons/hi';
import { useSyncedState } from './syncedState';

type Props = {
  setPage: (page: 'home' | 'edit-controls') => void;
};

export function EditControls({ setPage }: Props) {
  const { clicks, controls } = useSyncedState();
  return (
    <div class="flex justify-between">
      <div>
        <label class="text-lg font-medium text-gray-900 mb-4">
          Mouse-click modifiers:{' '}
        </label>
        <p>Modifier keys to enable "mouse click" and other shortcuts:</p>
        <div class="flex flex-col items-start gap-1 mt-2 flex-wrap mb-4">
          {Object.entries(modifiersTitles).map(([key, title]) => {
            return (
              <Switch
                size={'sm'}
                labelPlacement="end"
                onChange={(e: any) => {
                  controls.setControl(key, e.currentTarget.checked);
                }}
                checked={!!controls.getMap()[key]}
              >
                {title}
              </Switch>
            );
          })}
        </div>

        <label class="text-lg font-medium text-gray-900 mb-4">
          Total clicks:{' '}
        </label>
        <p>
          {clicks() ? (
            <>
              You have already used Locator <b>{clicks()}</b> times.
            </>
          ) : (
            'No clicks yet.'
          )}
        </p>
      </div>
      <CloseButton
        onClick={() => {
          setPage('home');
        }}
      />
    </div>
  );
}
