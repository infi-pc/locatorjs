import {
  DEFAULT_LAYER,
  allTargets,
  primaryEditorBinding,
  resolve,
  type Binding,
} from '@locator/shared';
import {
  BindingsEditor,
  EditorPicker,
  PromoFooter,
  Wizard,
  type WizardStep,
} from '@locator/ui';
import { css } from '@locator/styled-system/css';
import { createSignal } from 'solid-js';
import { useSyncedState } from '../Popup/syncedState';

const styles = {
  page: css({
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    minH: '100vh',
    p: '6',
  }),
  stack: css({ display: 'flex', flexDirection: 'column', gap: '3' }),
  text: css({ color: 'fg.muted', fontSize: 'sm' }),
  link: css({
    color: 'accent.plain.fg',
    textDecoration: 'underline',
  }),
};

export function Onboarding() {
  const { userExtension, setUserExtension } = useSyncedState();
  const [active, setActive] = createSignal('welcome');
  const effective = () =>
    resolve({
      default: DEFAULT_LAYER,
      'user-extension': userExtension(),
    }).effective;
  const editorAction = () => {
    const action = primaryEditorBinding(effective().bindings)?.action;
    return action?.kind === 'open-editor' ? action : undefined;
  };
  const updatePrimaryEditor = async (
    patch: Pick<
      Extract<Binding['action'], { kind: 'open-editor' }>,
      'targetId' | 'targetTemplate'
    >
  ) => {
    const bindings = effective().bindings ?? [];
    const primary = primaryEditorBinding(bindings);
    const index = primary ? bindings.indexOf(primary) : -1;
    if (index < 0) return false;
    const next = bindings.map((binding, bindingIndex) =>
      bindingIndex === index
        ? { ...binding, action: { kind: 'open-editor' as const, ...patch } }
        : binding
    );
    return (await setUserExtension({ bindings: next })).ok;
  };

  const steps = (): WizardStep[] => [
    {
      id: 'welcome',
      title: 'Welcome to LocatorJS',
      description:
        'Set up your editor and controls once, then use them on every site.',
      content: () => (
        <div class={styles.stack}>
          <p class={styles.text}>
            LocatorJS connects elements in the browser to the source files in
            your project.
          </p>
        </div>
      ),
    },
    {
      id: 'editor',
      title: 'Pick your editor',
      description: 'This updates your primary Open in editor action.',
      content: () => (
        <EditorPicker
          targets={allTargets}
          targetId={editorAction()?.targetId}
          targetTemplate={editorAction()?.targetTemplate}
          onChange={updatePrimaryEditor}
        />
      ),
    },
    {
      id: 'shortcuts',
      title: 'Choose your controls',
      description:
        'Modifier-click shortcuts and hover icons can run different actions.',
      content: () => (
        <BindingsEditor
          value={effective().bindings ?? []}
          targets={allTargets}
          onChange={(bindings) =>
            setUserExtension({ bindings, mouseModifiers: undefined })
          }
        />
      ),
    },
    {
      id: 'test',
      title: 'Try LocatorJS',
      description: 'Open the demo and use your primary shortcut on an element.',
      content: () => (
        <div class={styles.stack}>
          <a
            class={styles.link}
            href="https://www.locatorjs.com"
            target="_blank"
          >
            Open the LocatorJS demo
          </a>
          <p class={styles.text}>
            Click the page once to focus it, then hold your modifier and click
            an element.
          </p>
        </div>
      ),
    },
    {
      id: 'done',
      title: 'Setup complete',
      description: 'Pin the LocatorJS icon for quick access to site settings.',
      content: () => (
        <PromoFooter
          promos={[
            {
              text: 'Need help configuring a project?',
              href: 'https://www.locatorjs.com/install',
              linkLabel: 'View installation guides',
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div class={styles.page}>
      <Wizard
        size="page"
        steps={steps()}
        activeId={active()}
        onStepChange={setActive}
        onFinish={() => window.close()}
        finishLabel="Done"
      />
    </div>
  );
}
