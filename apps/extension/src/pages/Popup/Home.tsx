import {
  modifiersTitles,
  getModifiersMap,
  primaryEditorBinding,
  resolveTarget,
} from '@locator/shared';
import {
  Button,
  Kbd,
  ProvenanceBadge,
  SectionHeadline,
  editorIconFor,
} from '@locator/ui';
import { css } from '@locator/styled-system/css';
import { MousePointerClick, Power } from 'lucide-solid';
import { useSyncedState } from './syncedState';
import { Page } from './Page';

type Props = {
  setPage: (page: Page) => void;
};

const styles = {
  stack: css({ display: 'flex', flexDirection: 'column', gap: '3' }),
  card: css({ layerStyle: 'card', p: '3' }),
  controls: css({
    alignItems: 'center',
    display: 'flex',
    fontSize: 'sm',
    gap: '2',
    py: '1',
  }),
  controlText: css({ minW: '0' }),
  hint: css({ color: 'fg.muted', fontSize: 'xs', lineHeight: '5', mt: '1' }),
  editorRow: css({
    alignItems: 'center',
    display: 'flex',
    gap: '3',
    justifyContent: 'space-between',
  }),
  editorMain: css({
    alignItems: 'center',
    display: 'flex',
    gap: '2',
    minW: '0',
  }),
  editorIcon: css({
    alignItems: 'center',
    bg: 'accent.subtle.bg',
    borderColor: 'accent.surface.border',
    borderRadius: 'l2',
    borderWidth: '1px',
    color: 'accent.subtle.fg',
    display: 'inline-flex',
    flexShrink: '0',
    height: '8',
    justifyContent: 'center',
    width: '8',
  }),
  editorText: css({ color: 'fg.default', fontSize: 'sm' }),
  editorMeta: css({
    alignItems: 'center',
    color: 'fg.muted',
    display: 'flex',
    flexWrap: 'wrap',
    fontSize: 'xs',
    gap: '1.5',
    mt: '0.5',
  }),
  footer: css({
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '3',
    width: '100%',
  }),
  footerText: css({ color: 'fg.muted', fontSize: 'xs' }),
  sponsorLink: css({
    color: 'accent.plain.fg',
    textDecoration: 'underline',
    _hover: { color: 'accent.solid.bg.hover' },
  }),
  pointerIcon: css({ color: 'accent.plain.fg', flexShrink: '0' }),
};

export function Home(props: Props) {
  const { setSiteLocal, snapshot } = useSyncedState();

  const targetProvenance = () =>
    snapshot()?.provenance.targetTemplate ?? snapshot()?.provenance.targetId;
  const currentEditor = () => {
    const s = snapshot();
    if (!s) return undefined;
    const target = resolveTarget(s.effective, s.allTargets);
    return target.kind === 'template'
      ? target.url
      : s.allTargets[target.id]?.label ?? target.id;
  };
  const currentEditorId = () => {
    const s = snapshot();
    if (!s) return 'custom';
    const target = resolveTarget(s.effective, s.allTargets);
    return target.kind === 'template' ? 'custom' : target.id || 'custom';
  };

  return (
    <div class={styles.stack}>
      <div class={styles.card}>
        <SectionHeadline>Controls</SectionHeadline>

        <div class={styles.controls}>
          <MousePointerClick size={18} class={styles.pointerIcon} />
          <span class={styles.controlText}>
            <b>
              <Modifiers /> + <Kbd>click</Kbd>
            </b>{' '}
            opens your editor
          </span>
        </div>
        <p class={styles.hint}>
          Click the page once first so your app has focus.
        </p>
      </div>

      <div class={styles.card}>
        <div class={styles.editorRow}>
          <div class={styles.editorMain}>
            <span class={styles.editorIcon}>
              {editorIconFor(currentEditorId())}
            </span>
            <div>
              <div class={styles.editorText}>
                Editor: <b>{currentEditor() ?? '—'}</b>
              </div>
              <div class={styles.editorMeta}>
                <span>Resolved setting</span>
                <ProvenanceBadge layer={targetProvenance()} />
              </div>
            </div>
          </div>
          <Button
            size="xs"
            variant="ghost"
            onClick={() =>
              props.setPage({ type: 'settings', tab: 'user-extension' })
            }
          >
            Change
          </Button>
        </div>
      </div>

      <div class={styles.footer}>
        <div class={styles.footerText}>
          Support me on{' '}
          <a
            class={styles.sponsorLink}
            href="https://github.com/sponsors/infi-pc"
            target="_blank"
          >
            GitHub sponsors
          </a>
        </div>
        <Button
          variant="danger-ghost"
          size="xs"
          disabled={!snapshot()}
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

function Modifiers() {
  const { snapshot } = useSyncedState();
  const map = () =>
    getModifiersMap(
      primaryEditorBinding(snapshot()?.effective.bindings)?.modifiers ?? 'alt'
    );
  return (
    <>
      {Object.keys(map()).map((key, i) => {
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
