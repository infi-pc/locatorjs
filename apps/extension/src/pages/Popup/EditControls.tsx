import { CloseButton, IconButton, Switch } from '@hope-ui/solid';
import { modifiersTitles } from '@locator/shared';
import { HiSolidX } from 'solid-icons/hi';
import clickCount from './clickCount';
import { changeControls, controlsMap } from './controls';

type Props = {
  setPage: (page: 'home' | 'edit-controls') => void;
};

export function EditControls({ setPage }: Props) {
  return (
    <div class="flex justify-between">
      <div>
        <label class="text-lg font-medium text-gray-900 mb-4">
          Mouse-click modifiers:{' '}
        </label>
        <p>Modifier keys to enable "mouse click" and other shortcuts:</p>
        <div class="flex flex-col items-start gap-1 mt-2">
          {Object.entries(modifiersTitles).map(([key, title]) => {
            return (
              <Switch
                labelPlacement="end"
                onChange={(e: any) => {
                  changeControls(key, e.currentTarget.checked);
                }}
                checked={!!controlsMap()[key]}
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
          {clickCount()
            ? `You have already used Locator ${clickCount()} times.`
            : 'No clicks yet.'}
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
