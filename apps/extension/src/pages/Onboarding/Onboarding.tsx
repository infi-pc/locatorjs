import {
  DEFAULT_LAYER,
  allTargets,
  asEditorSelection,
  clearPrimaryEditorOverride,
  getModifiersMap,
  primaryEditorBinding,
  resolve,
  type Binding,
  type EditorSelection,
} from '@locator/shared';
import {
  EDITOR_CARD_CUSTOM,
  EditorCardPicker,
  PrimaryShortcutPicker,
  TextInput,
  Wizard,
  type WizardStep,
} from '@locator/ui';
import { css } from '@locator/styled-system/css';
import { Show, createSignal, onCleanup } from 'solid-js';
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
  // Reserves room above the test area for the floating component label.
  testWrap: css({ mt: '6', position: 'relative' }),
  testArea: css({
    alignItems: 'center',
    bg: 'gray.subtle.bg',
    borderColor: 'border',
    borderRadius: 'l2',
    borderWidth: '1px',
    cursor: 'pointer',
    display: 'flex',
    fontSize: 'sm',
    fontWeight: 'medium',
    h: '24',
    justifyContent: 'center',
    width: '100%',
  }),
  // Mimics the runtime's component outline (Outline/ComponentOutline).
  testOutline: css({
    borderColor: 'violet.9',
    borderRadius: 'l2',
    borderStyle: 'solid',
    borderWidth: '1px',
    inset: '-6px',
    pointerEvents: 'none',
    position: 'absolute',
  }),
  testOutlineLabel: css({
    bg: 'violet.solid.bg',
    borderRadius: 'l1',
    color: 'violet.solid.fg',
    fontSize: 'xs',
    fontWeight: 'bold',
    left: '50%',
    lineHeight: '18px',
    position: 'absolute',
    px: '1',
    py: '0.5',
    top: '-28px',
    transform: 'translateX(-50%)',
    whiteSpace: 'nowrap',
  }),
  okText: css({ color: 'teal.plain.fg', fontSize: 'sm' }),
  missText: css({ color: 'amber.plain.fg', fontSize: 'sm' }),
};

const DEFAULT_CUSTOM_TEMPLATE =
  'vscode://file/${projectPath}${filePath}:${line}:${column}';

const MODIFIER_LABELS: Record<string, string> = {
  alt: 'Option',
  ctrl: 'Ctrl',
  shift: 'Shift',
  meta: 'Command',
};

function modifiersLabel(modifiers?: string) {
  const keys = Object.keys(getModifiersMap(modifiers ?? ''));
  return keys.length
    ? `${keys.map((key) => MODIFIER_LABELS[key] ?? key).join(' + ')} + click`
    : 'click';
}

function ShortcutTester(props: { modifiers?: string }) {
  const [result, setResult] = createSignal<'idle' | 'ok' | 'miss'>('idle');
  const [detected, setDetected] = createSignal('');
  const [hovering, setHovering] = createSignal(false);
  const [activeMatch, setActiveMatch] = createSignal(false);
  const keys = ['alt', 'ctrl', 'shift', 'meta'] as const;
  const pressedFrom = (event: MouseEvent | KeyboardEvent) => ({
    alt: event.altKey,
    ctrl: event.ctrlKey,
    shift: event.shiftKey,
    meta: event.metaKey,
  });
  const matches = (
    pressed: Record<'alt' | 'ctrl' | 'shift' | 'meta', boolean>
  ) => {
    if (!props.modifiers) return false;
    const expected = getModifiersMap(props.modifiers);
    return keys.every((key) => pressed[key] === !!expected[key]);
  };
  // Mouse events only fire on movement; key listeners keep the outline in
  // sync when modifiers change while the pointer is stationary.
  const detect = (event: MouseEvent | KeyboardEvent) =>
    setActiveMatch(matches(pressedFrom(event)));
  const onKey = (event: KeyboardEvent) => {
    if (hovering()) detect(event);
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKey);
  onCleanup(() => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('keyup', onKey);
  });
  const onMouseMove = (event: MouseEvent) => {
    setHovering(true);
    detect(event);
  };
  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    const pressed = pressedFrom(event);
    setDetected(modifiersLabel(keys.filter((key) => pressed[key]).join('+')));
    setResult(matches(pressed) ? 'ok' : 'miss');
  };
  return (
    <div class={styles.stack}>
      <div class={styles.testWrap}>
        <button
          type="button"
          class={styles.testArea}
          data-testid="shortcut-tester"
          onClick={onClick}
          onMouseMove={onMouseMove}
          onMouseLeave={() => {
            setHovering(false);
            setActiveMatch(false);
          }}
        >
          <Show
            when={result() === 'ok'}
            fallback={<>Hold your shortcut and click here</>}
          >
            <span class={styles.okText}>
              It works — now go try it on your dev project.
            </span>
          </Show>
        </button>
        <Show when={hovering() && activeMatch()}>
          <div class={styles.testOutline}>
            <span class={styles.testOutlineLabel}>TestComponent</span>
          </div>
        </Show>
      </div>
      <Show when={result() === 'miss'}>
        <p class={styles.missText}>
          Detected "{detected()}". Adjust the chips above and try again.
        </p>
      </Show>
    </div>
  );
}

export function Onboarding() {
  const { userExtension, setUserExtension } = useSyncedState();
  const [active, setActive] = createSignal('editor');
  const [showCustom, setShowCustom] = createSignal(false);
  const [customDraft, setCustomDraft] = createSignal('');
  const effective = () =>
    resolve({
      default: DEFAULT_LAYER,
      'user-extension': userExtension(),
    }).effective;
  const editor = () => effective().editor;
  const modifiers = () => {
    const binding = primaryEditorBinding(effective().bindings);
    return binding?.trigger.kind === 'modifier-click'
      ? binding.trigger.modifiers
      : undefined;
  };
  const setBindings = async (bindings: Binding[] | undefined) =>
    (await setUserExtension({ bindings })).ok;

  const updateEditor = async (selection: EditorSelection) => {
    const bindings = clearPrimaryEditorOverride(effective().bindings ?? []);
    const result = await setUserExtension({
      editor: selection,
      ...(bindings ? { bindings, mouseModifiers: undefined } : {}),
    });
    return result.ok;
  };
  const updateModifiers = (value: string | undefined) => {
    if (!value) return;
    const bindings = effective().bindings ?? [];
    const primary = primaryEditorBinding(bindings);
    if (!primary) return;
    return setBindings(
      bindings.map((binding) =>
        binding === primary
          ? {
              ...binding,
              trigger: { kind: 'modifier-click', modifiers: value },
            }
          : binding
      )
    );
  };

  const selectEditor = async (value: string) => {
    if (value === EDITOR_CARD_CUSTOM) {
      setCustomDraft(editor()?.targetTemplate ?? DEFAULT_CUSTOM_TEMPLATE);
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    if (await updateEditor(asEditorSelection(value))) setActive('shortcut');
  };

  const saveCustomTemplate = async () => {
    const saved = await updateEditor({
      targetTemplate: customDraft().trim() || undefined,
    });
    if (saved) {
      setShowCustom(false);
      setActive('shortcut');
    }
  };

  const steps = (): WizardStep[] => [
    {
      id: 'editor',
      // eslint-disable-next-line solid/reactivity -- steps() runs inside a tracked JSX scope
      title: showCustom() ? 'Custom link template' : 'Pick your editor',
      // eslint-disable-next-line solid/reactivity -- step access runs inside the tracked Wizard render callback.
      description: showCustom()
        ? 'Enter a URL template for your custom editor.'
        : 'This sets your primary Open in editor action.',
      // eslint-disable-next-line solid/reactivity -- step access runs inside the tracked Wizard render callback.
      onNext: showCustom() ? () => saveCustomTemplate() : undefined,
      // eslint-disable-next-line solid/reactivity -- step access runs inside the tracked Wizard render callback.
      onBack: showCustom() ? () => setShowCustom(false) : undefined,
      content: () => (
        <Show
          when={showCustom()}
          fallback={
            <EditorCardPicker
              targets={allTargets}
              targetId={editor()?.targetId}
              targetTemplate={editor()?.targetTemplate}
              onSelect={selectEditor}
            />
          }
        >
          <div class={styles.stack}>
            <TextInput
              mono
              aria-label="Custom link template"
              value={customDraft()}
              placeholder="editor://file/${projectPath}${filePath}:${line}:${column}"
              onInput={(event) => setCustomDraft(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  saveCustomTemplate();
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  setShowCustom(false);
                }
              }}
            />
            <p class={styles.text}>
              Available variables: projectPath, filePath, line, column,
              tmuxSession
            </p>
          </div>
        </Show>
      ),
    },
    {
      id: 'shortcut',
      title: 'Choose your shortcut',
      description:
        'One keyboard combination is all you need to open elements in your editor.',
      content: () => (
        <div class={styles.stack}>
          <PrimaryShortcutPicker
            modifiers={modifiers()}
            onChange={updateModifiers}
          />
          <ShortcutTester modifiers={modifiers()} />
        </div>
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
