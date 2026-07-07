import { ArrowLeft } from 'lucide-solid';
import { allTargets, DEFAULT_LAYER, resolve } from '@locator/shared';
import {
  Button,
  LayeredOptionsEditor,
  LayerTabConfig,
  SectionHeadline,
} from '@locator/ui';
import { useSyncedState } from './syncedState';
import { Page } from './Page';

type Props = {
  setPage: (page: Page) => void;
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
    <div>
      <div class="mb-2 flex items-center justify-between">
        <SectionHeadline>Settings</SectionHeadline>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => props.setPage({ type: 'home' })}
        >
          <ArrowLeft size={14} /> back
        </Button>
      </div>
      <LayeredOptionsEditor
        tabs={tabs()}
        effective={effective()}
        provenance={provenance()}
        targets={targets()}
      />
      <div class="mt-2 text-[11px] text-gray-400">
        {status() === 'connected'
          ? 'Later layers override earlier ones: defaults < team < extension < this origin.'
          : 'Connect to a page running LocatorJS to edit per-origin and see team settings.'}
      </div>
    </div>
  );
}
