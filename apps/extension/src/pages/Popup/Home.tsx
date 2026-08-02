import { allTargets, DEFAULT_LAYER } from '@locator/shared';
import { ActionSettings, Button } from '@locator/ui';
import { css } from '@locator/styled-system/css';
import { Power } from 'lucide-solid';
import { useSyncedState } from './syncedState';

const styles = {
  stack: css({ display: 'flex', flexDirection: 'column', gap: '2' }),
  footer: css({
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '3',
    width: '100%',
    pb: '10',
  }),
  footerText: css({ color: 'fg.muted', fontSize: 'xs' }),
  advancedExtras: css({ display: 'flex', flexDirection: 'column', gap: '2' }),
  advancedHelp: css({
    layerStyle: 'card',
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
    p: '3',
  }),
  sponsorLink: css({
    color: 'accent.plain.fg',
    textDecoration: 'underline',
    _hover: { color: 'accent.solid.bg.hover' },
  }),
};

export function Home() {
  const { setSiteLocal, setUserExtension, snapshot, userExtension, status } =
    useSyncedState();
  const connected = () => status() === 'connected' && !!snapshot();
  const layers = () => {
    const connected = snapshot()?.layers;
    return connected
      ? {
          ...connected,
          default: connected.default ?? DEFAULT_LAYER,
          'user-extension': userExtension(),
        }
      : {
          default: DEFAULT_LAYER,
          'user-extension': userExtension(),
        };
  };
  const targets = () => snapshot()?.allTargets ?? allTargets;

  return (
    <div class={styles.stack}>
      <ActionSettings
        layers={layers()}
        targets={targets()}
        surface="popup"
        scopes={[
          {
            layer: 'user-origin',
            label: 'This site',
            write: setSiteLocal,
            disabled: !connected(),
            disabledReason:
              'Connect to a page running LocatorJS to edit this site.',
            note: 'Overrides stored only for the current site.',
          },
          {
            layer: 'user-extension',
            label: 'All sites',
            write: setUserExtension,
            note: 'Personal defaults used on every LocatorJS site.',
          },
        ]}
        defaultScope={connected() ? 'user-origin' : 'user-extension'}
        unavailableLayers={connected() ? [] : ['team', 'user-origin']}
        advancedExtras={
          <div class={styles.advancedExtras}>
            {!connected() && (
              <div class={styles.advancedHelp}>
                <div class={styles.footerText}>
                  Connect a page running LocatorJS to inspect team and site
                  configuration.
                </div>
                <a
                  class={styles.sponsorLink}
                  href="https://www.locatorjs.com/install"
                  target="_blank"
                >
                  Installation guides
                </a>
                <a
                  class={styles.sponsorLink}
                  href="https://github.com/infi-pc/locatorjs/blob/master/apps/extension/README.md#troubleshooting"
                  target="_blank"
                >
                  Extension troubleshooting
                </a>
              </div>
            )}
            <div class={styles.footerText}>
              Share Locator defaults with your team.{' '}
              <a
                class={styles.sponsorLink}
                href="https://www.locatorjs.com/docs"
                target="_blank"
              >
                Set up Locator via setup()
              </a>
            </div>
            <div class={styles.footerText}>
              Support LocatorJS on{' '}
              <a
                class={styles.sponsorLink}
                href="https://github.com/sponsors/infi-pc"
                target="_blank"
              >
                GitHub sponsors
              </a>
            </div>
          </div>
        }
      />

      <div class={styles.footer}>
        <span />
        <Button
          variant="danger-ghost"
          size="xs"
          disabled={status() !== 'connected' || !snapshot()}
          onClick={() => {
            setSiteLocal({ disabled: true });
          }}
        >
          <Power size={16} />
          Disable on this page
        </Button>
      </div>
    </div>
  );
}
