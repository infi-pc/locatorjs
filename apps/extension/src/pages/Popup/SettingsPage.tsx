import { allTargets, DEFAULT_LAYER } from '@locator/shared';
import { LayeredOptionsEditor } from '@locator/ui';
import { css } from '@locator/styled-system/css';
import { useSyncedState } from './syncedState';

type Props = {
  page: Extract<import('./Page').Page, { type: 'settings' }>;
};

const styles = {
  root: css({ mx: '-4' }),
  note: css({ color: 'fg.subtle', fontSize: 'xs', mt: '2', px: '4' }),
};

export function SettingsPage(props: Props) {
  const { snapshot, status, userExtension, setUserExtension, setSiteLocal } =
    useSyncedState();

  const targets = () => snapshot()?.allTargets ?? allTargets;

  return (
    <div class={styles.root}>
      <LayeredOptionsEditor
        layers={{
          default: snapshot()?.layers.default ?? DEFAULT_LAYER,
          team: snapshot()?.layers.team ?? {},
          'user-extension': userExtension(),
          'user-origin': snapshot()?.layers['user-origin'] ?? {},
        }}
        writeScopes={[
          {
            layer: 'user-origin',
            label: 'This site',
            write: setSiteLocal,
            disabled: !snapshot(),
            disabledReason:
              'Connect to a page running LocatorJS to edit this site.',
            note: snapshot()
              ? 'Overrides stored only for the current site.'
              : 'No LocatorJS runtime detected on this page.',
          },
          {
            layer: 'user-extension',
            label: 'All sites',
            write: setUserExtension,
            note: 'Personal defaults used on every LocatorJS site.',
          },
        ]}
        targets={targets()}
        defaultId={
          props.page.tab === 'user-origin' ? 'user-origin' : 'user-extension'
        }
      />
      <div class={styles.note}>
        {status() === 'connected'
          ? 'Later layers override earlier ones: defaults < team < extension < this origin.'
          : 'Connect to a page running LocatorJS to edit per-origin and see team settings.'}
      </div>
    </div>
  );
}
