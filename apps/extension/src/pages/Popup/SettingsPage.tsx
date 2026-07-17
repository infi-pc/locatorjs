import { allTargets, DEFAULT_LAYER, resolve } from '@locator/shared';
import { LayeredOptionsEditor, LayerTabConfig } from '@locator/ui';
import { css } from '@locator/styled-system/css';
import { useSyncedState } from './syncedState';
import { Page } from './Page';

type Props = {
  setPage: (page: Page) => void;
  page: Extract<Page, { type: 'settings' }>;
};

const styles = {
  root: css({ mx: '-4' }),
  note: css({ color: 'fg.subtle', fontSize: 'xs', mt: '2', px: '4' }),
};

export function SettingsPage(props: Props) {
  const { snapshot, status, userExtension, setUserExtension, setSiteLocal } =
    useSyncedState();

  // Without a runtime on the page we can still edit the extension layer;
  // resolve locally so effective values and provenance stay meaningful.
  const resolvedOffline = () =>
    resolve({ default: DEFAULT_LAYER, 'user-extension': userExtension() });

  const effective = () => snapshot()?.effective ?? resolvedOffline().effective;
  const provenance = () =>
    snapshot()?.provenance ?? resolvedOffline().provenance;
  const targets = () => snapshot()?.allTargets ?? allTargets;

  const tabs = (): LayerTabConfig[] => [
    {
      layer: 'user-origin',
      label: 'This origin',
      values: snapshot()?.layers['user-origin'] ?? {},
      write: snapshot() ? setSiteLocal : undefined,
      disabled: !snapshot(),
      disabledReason:
        'Connect to a page running LocatorJS to edit this origin.',
      note: snapshot()
        ? 'Stored in this page’s origin — applies to everyone opening it in this browser profile.'
        : 'No LocatorJS runtime detected on this page — per-origin settings are unavailable.',
    },
    {
      layer: 'user-extension',
      label: 'Extension',
      values: userExtension(),
      write: setUserExtension,
      note: 'Your defaults — apply on every site where the extension runs.',
    },
    {
      layer: 'team',
      label: 'Team',
      values: snapshot()?.layers.team ?? {},
      disabled: !snapshot(),
      disabledReason:
        'Connect to a page running LocatorJS to inspect team settings.',
      note: snapshot()
        ? 'Defined by setup() in the app’s code — change it in the repository.'
        : 'No LocatorJS runtime detected on this page.',
    },
    {
      layer: 'default',
      label: 'Defaults',
      values: snapshot()?.layers.default ?? DEFAULT_LAYER,
      note: 'Built-in LocatorJS defaults.',
    },
  ];

  return (
    <div class={styles.root}>
      <LayeredOptionsEditor
        tabs={tabs()}
        effective={effective()}
        provenance={provenance()}
        targets={targets()}
        defaultId={props.page.tab ?? 'user-extension'}
      />
      <div class={styles.note}>
        {status() === 'connected'
          ? 'Later layers override earlier ones: defaults < team < extension < this origin.'
          : 'Connect to a page running LocatorJS to edit per-origin and see team settings.'}
      </div>
    </div>
  );
}
