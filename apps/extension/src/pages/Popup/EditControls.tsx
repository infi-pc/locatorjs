import { CloseButton, IconButton, Switch } from '@hope-ui/solid';
import { modifiersTitles } from '@locator/shared';
import { Page } from './Page';
import SectionHeadline from './SectionHeadline';
import { useSyncedState } from './syncedState';

type Props = {
  setPage: (page: Page) => void;
};

export function EditControls({ setPage }: Props) {
  const { clicks, controls, allowTracking, sharedOnSocialMedia } =
    useSyncedState();
  return (
    <div class="flex justify-between">
      <div>
        <SectionHeadline>Mouse-click modifiers: </SectionHeadline>
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

        <SectionHeadline>Total clicks: </SectionHeadline>
        <p class=" mb-4">
          {clicks() ? (
            <>
              You have already used Locator <b>{clicks()}</b> times.
            </>
          ) : (
            'No clicks yet.'
          )}
        </p>

        <SectionHeadline>Others: </SectionHeadline>
        <div class="flex flex-col gap-1 mb-2 items-start">
          <Switch
            size={'sm'}
            labelPlacement="end"
            onChange={(e: any) => {
              allowTracking.set(e.currentTarget.checked);
            }}
            checked={!!allowTracking.get()}
          >
            Allow anonymous tracking
          </Switch>
          <Switch
            size={'sm'}
            labelPlacement="end"
            onChange={(e: any) => {
              sharedOnSocialMedia.set(
                e.currentTarget.checked ? 'disabled_in_settings' : ''
              );
            }}
            checked={!!sharedOnSocialMedia.get()}
          >
            Hide share panel
          </Switch>
        </div>
      </div>
      <CloseButton
        onClick={() => {
          setPage({ type: 'home' });
        }}
      />
    </div>
  );
}
