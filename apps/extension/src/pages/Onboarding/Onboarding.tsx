import { clearPrimaryEditorOverride, strictConfig } from '@locator/shared';
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
  errorText: css({ color: 'red.plain.fg', fontSize: 'sm' }),
};

const DEFAULT_CUSTOM_TEMPLATE =
  'vscode://file/${projectPath}${filePath}:${line}:${column}';
const ALL_TARGETS = strictConfig.targetRegistryView(
  strictConfig.BUILT_IN_TARGETS
);

const MODIFIER_LABELS: Record<string, string> = {
  alt: 'Option',
  ctrl: 'Ctrl',
  shift: 'Shift',
  meta: 'Command',
};

function modifiersLabel(modifiers?: readonly strictConfig.Modifier[]) {
  return modifiers?.length
    ? `${modifiers
        .map((key) => MODIFIER_LABELS[key] ?? key)
        .join(' + ')} + click`
    : 'click';
}

function ShortcutTester(props: {
  modifiers?: readonly strictConfig.Modifier[];
}) {
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
    const expected = new Set(props.modifiers);
    return keys.every((key) => pressed[key] === expected.has(key));
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
    setDetected(modifiersLabel(keys.filter((key) => pressed[key])));
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
  const [customError, setCustomError] = createSignal<string>();
  const [busy, setBusy] = createSignal(false);
  const effective = () => {
    const parsed = strictConfig.parseLayer(userExtension());
    if (!parsed.ok) {
      throw new Error('Stored extension configuration is invalid.');
    }
    return strictConfig.effectiveOptions(
      strictConfig.resolveConfig(
        {
          default: strictConfig.DEFAULT_LAYER,
          'user-extension': parsed.value,
        },
        strictConfig.BUILT_IN_TARGETS
      )
    );
  };
  const editor = (): strictConfig.EditorDestination | undefined => {
    const value = effective().editor;
    return value.kind === 'selected'
      ? strictConfig.encodeEditorDestination(value.destination)
      : undefined;
  };
  const bindings = () => strictConfig.encodeBindings(effective().bindings);
  const modifiers = () => {
    const binding = bindings().find(
      (item) =>
        item.trigger.kind === 'modifier-click' &&
        item.action.kind === 'open-editor'
    );
    return binding?.trigger.kind === 'modifier-click'
      ? binding.trigger.modifiers
      : undefined;
  };
  const setBindings = async (
    next: readonly strictConfig.BindingInput[] | undefined
  ) =>
    (async () => {
      if (busy()) return false;
      setBusy(true);
      try {
        return (
          await setUserExtension(
            next ? { set: { bindings: next } } : { unset: ['bindings'] }
          )
        ).ok;
      } finally {
        setBusy(false);
      }
    })();

  const updateEditor = async (destination: strictConfig.EditorDestination) => {
    if (busy()) return false;
    const nextBindings = clearPrimaryEditorOverride(bindings());
    setBusy(true);
    try {
      const result = await setUserExtension({
        set: {
          editor: destination,
          ...(nextBindings ? { bindings: nextBindings } : {}),
        },
      });
      return result.ok;
    } finally {
      setBusy(false);
    }
  };
  const updateModifiers = (
    value:
      | readonly [strictConfig.Modifier, ...strictConfig.Modifier[]]
      | undefined
  ) => {
    if (!value) return;
    const current = bindings();
    const primaryIndex = current.findIndex(
      (binding) =>
        binding.trigger.kind === 'modifier-click' &&
        binding.action.kind === 'open-editor'
    );
    if (primaryIndex < 0) return;
    return setBindings(
      current.map((binding, index) =>
        index === primaryIndex
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
      const currentEditor = editor();
      setCustomDraft(
        currentEditor?.kind === 'template'
          ? currentEditor.template
          : DEFAULT_CUSTOM_TEMPLATE
      );
      setCustomError(undefined);
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    if (await updateEditor({ kind: 'target', id: value })) {
      setActive('shortcut');
    }
  };

  const saveCustomTemplate = async () => {
    if (busy()) return;
    const template = customDraft().trim();
    if (!template) {
      setCustomError('Enter a link template.');
      return;
    }
    const parsed = strictConfig.parseLayer({
      editor: { kind: 'template', template },
    });
    if (!parsed.ok) {
      setCustomError(parsed.errors[0]?.message ?? 'Invalid template.');
      return;
    }
    const saved = await updateEditor({ kind: 'template', template });
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
              targets={ALL_TARGETS}
              value={editor()}
              onSelect={selectEditor}
              disabled={busy()}
            />
          }
        >
          <div class={styles.stack}>
            <TextInput
              mono
              aria-label="Custom link template"
              value={customDraft()}
              disabled={busy()}
              aria-invalid={customError() ? true : undefined}
              placeholder="editor://file/${projectPath}${filePath}:${line}:${column}"
              onInput={(event) => {
                setCustomDraft(event.currentTarget.value);
                setCustomError(undefined);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  void saveCustomTemplate();
                } else if (event.key === 'Escape') {
                  event.preventDefault();
                  if (!busy()) setShowCustom(false);
                }
              }}
            />
            <p class={styles.text}>
              Available variables: projectPath, filePath, line, column,
              tmuxSession
            </p>
            <Show when={customError()}>
              <p class={styles.errorText} role="alert">
                {customError()}
              </p>
            </Show>
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
        onFinish={() => {
          if (!busy() && editor() !== undefined && !showCustom())
            window.close();
        }}
        onSkip={() => {
          if (!busy()) window.close();
        }}
        busy={busy()}
        nextDisabled={showCustom() ? busy() : editor() === undefined}
        finishDisabled={busy() || editor() === undefined || showCustom()}
        finishLabel="Done"
      />
    </div>
  );
}
