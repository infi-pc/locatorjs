import { allTargets, DEFAULT_LAYER, type LocatorLayer } from '@locator/shared';
import {
  ActionSettings,
  Button,
  type ActionSettingsSaveStatus,
} from '@locator/ui';
import { css } from '@locator/styled-system/css';
import { Power, RotateCcw } from 'lucide-solid';
import { Show, createEffect, createSignal } from 'solid-js';
import { useSyncedState } from './syncedState';

const styles = {
  stack: css({ display: 'flex', flexDirection: 'column', gap: '2' }),
  footer: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '3',
    justifyContent: 'space-between',
    pt: '3',
    width: '100%',
  }),
  footerText: css({ color: 'fg.muted', fontSize: 'xs' }),
  footerActions: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1',
  }),
  advancedExtras: css({ display: 'flex', flexDirection: 'column', gap: '2' }),
  advancedHelp: css({
    layerStyle: 'card',
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
    p: '3',
  }),
  link: css({
    color: 'accent.plain.fg',
    textDecoration: 'underline',
    _hover: { color: 'accent.solid.bg.hover' },
  }),
};

export function Home() {
  const {
    setSiteLocal,
    setUserExtension,
    clearSiteLocal,
    clearUserExtension,
    tryAction,
    snapshot,
    userExtension,
    status,
  } = useSyncedState();
  const connected = () => status() === 'connected' && !!snapshot();
  /**
   * What the user picked, kept apart from what is currently writable. "This
   * site" is not editable while the page is disconnected, but a transient poll
   * failure -- an HMR reload, a missed reply -- must not silently promote the
   * choice to "All sites" for good, or the next save lands in the wrong layer.
   */
  const [chosenScope, setChosenScope] =
    createSignal<LocatorLayer>('user-origin');
  const activeScope = (): LocatorLayer =>
    !connected() && chosenScope() === 'user-origin'
      ? 'user-extension'
      : chosenScope();
  const [saveStatus, setSaveStatus] =
    createSignal<ActionSettingsSaveStatus>('idle');
  const [confirmReset, setConfirmReset] = createSignal(false);
  const [actionError, setActionError] = createSignal<string>();

  createEffect(() => {
    if (!connected()) setConfirmReset(false);
  });

  const layers = () => {
    const connectedLayers = snapshot()?.layers;
    return connectedLayers
      ? {
          ...connectedLayers,
          default: connectedLayers.default ?? DEFAULT_LAYER,
          'user-extension': userExtension(),
        }
      : {
          default: DEFAULT_LAYER,
          'user-extension': userExtension(),
        };
  };
  const targets = () => snapshot()?.allTargets ?? allTargets;
  const tryUnavailable = () => !connected() || !!snapshot()?.effective.disabled;
  const resetLabel = () =>
    activeScope() === 'user-origin' ? 'This site' : 'All sites';
  const resetPrompt = () =>
    activeScope() === 'user-origin'
      ? 'Reset settings for this site?'
      : 'Reset your All sites defaults?';

  const reset = async () => {
    setSaveStatus('saving');
    const result =
      activeScope() === 'user-origin'
        ? await clearSiteLocal()
        : await clearUserExtension();
    setSaveStatus(result.ok ? 'saved' : 'error');
    setActionError(result.ok ? undefined : `Could not reset ${resetLabel()}.`);
    if (result.ok) setConfirmReset(false);
  };

  return (
    <div class={styles.stack}>
      <ActionSettings
        layers={layers()}
        targets={targets()}
        scopes={[
          {
            layer: 'user-origin',
            label: 'This site',
            write: setSiteLocal,
            disabled: !connected(),
            disabledReason:
              'Connect to a page running LocatorJS to edit this site.',
          },
          {
            layer: 'user-extension',
            label: 'All sites',
            write: setUserExtension,
            editLayers: {
              default: DEFAULT_LAYER,
              'user-extension': userExtension(),
            },
          },
        ]}
        activeScope={activeScope()}
        onActiveScopeChange={(layer) => {
          setChosenScope(layer);
          setConfirmReset(false);
          setActionError(undefined);
        }}
        unavailableLayers={connected() ? [] : ['team', 'user-origin']}
        tryDisabled={tryUnavailable()}
        tryDisabledReason={
          !connected()
            ? 'Connect to a page running LocatorJS to try this action.'
            : 'Enable LocatorJS on this page to try this action.'
        }
        onTryAction={async (action) => {
          setActionError(undefined);
          const result = await tryAction(action);
          if (result.ok) {
            window.close();
          } else {
            setActionError(
              result.reason === 'disabled'
                ? 'Enable LocatorJS on this page before trying an action.'
                : 'Could not start Try mode. Keep the page open and try again.'
            );
          }
        }}
        onSaveStatusChange={setSaveStatus}
        advancedExtras={
          <div class={styles.advancedExtras}>
            <Show when={!connected()}>
              <div class={styles.advancedHelp}>
                <div class={styles.footerText}>
                  Connect a page running LocatorJS to inspect team and site
                  configuration.
                </div>
                <a
                  class={styles.link}
                  href="https://www.locatorjs.com/install"
                  target="_blank"
                >
                  Installation guides
                </a>
                <a
                  class={styles.link}
                  href="https://github.com/infi-pc/locatorjs/blob/master/apps/extension/README.md#troubleshooting"
                  target="_blank"
                >
                  Extension troubleshooting
                </a>
              </div>
            </Show>
            <div class={styles.footerText}>
              Share Locator defaults with your team.{' '}
              <a
                class={styles.link}
                href="https://www.locatorjs.com/docs"
                target="_blank"
              >
                Set up Locator via setup()
              </a>
            </div>
          </div>
        }
      />

      <Show when={actionError()}>
        <div class={styles.footerText} role="alert">
          {actionError()}
        </div>
      </Show>
      <div class={styles.footer}>
        <span class={styles.footerText} role="status">
          {saveStatus() === 'saving'
            ? 'Saving…'
            : saveStatus() === 'saved'
            ? 'Saved'
            : saveStatus() === 'error'
            ? 'Could not save'
            : connected()
            ? 'Connected'
            : 'Editing All sites offline'}
        </span>
        <div class={styles.footerActions}>
          <Show when={confirmReset()}>
            <span class={styles.footerText}>{resetPrompt()}</span>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setConfirmReset(false)}
            >
              Cancel
            </Button>
            <Button size="xs" variant="danger-ghost" onClick={reset}>
              Reset {resetLabel()}
            </Button>
          </Show>
          <Show when={!confirmReset()}>
            <Button
              size="xs"
              variant="ghost"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw size={14} /> Reset
            </Button>
          </Show>
          <Button
            variant="danger-ghost"
            size="xs"
            disabled={!connected()}
            onClick={async () => {
              setSaveStatus('saving');
              const result = await setSiteLocal({ disabled: true });
              setSaveStatus(result.ok ? 'saved' : 'error');
              setActionError(
                result.ok ? undefined : 'Could not disable LocatorJS here.'
              );
            }}
          >
            <Power size={16} /> Disable on this page
          </Button>
        </div>
      </div>
    </div>
  );
}
