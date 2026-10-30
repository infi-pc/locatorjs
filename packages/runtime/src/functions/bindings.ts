import { strictConfig } from "@locator/shared";

type ModifierEvent = Pick<
  MouseEvent | KeyboardEvent,
  "altKey" | "ctrlKey" | "metaKey" | "shiftKey"
>;

export function effectiveBindings(
  options: strictConfig.EffectiveOptions
): readonly strictConfig.ConfiguredBinding[] {
  return strictConfig.configuredBindings(options.bindings);
}

export function iconBindings(
  bindings: readonly strictConfig.ConfiguredBinding[]
): readonly strictConfig.ConfiguredBinding[] {
  return bindings.filter((binding) => binding.trigger.kind === "hover-toolbar");
}

const fallbackActivationChord = strictConfig.modifierChordFromState({
  alt: true,
  ctrl: false,
  meta: false,
  shift: false,
});
if (fallbackActivationChord === null) {
  throw new Error("The fallback activation chord is invalid.");
}
export const FALLBACK_ACTIVATION_CHORD = fallbackActivationChord;

/**
 * macOS reports Ctrl+click as a context-menu gesture. A spurious Ctrl is only
 * ignored when the configured chord itself does not require Ctrl.
 */
function chordFromEvent(
  event: ModifierEvent,
  config: { ignoreCtrl?: boolean } = {},
  expected?: strictConfig.ModifierChord
): strictConfig.ModifierChord | null {
  const expectedUsesCtrl = expected
    ? strictConfig.modifiersForChord(expected).includes("ctrl")
    : false;
  return strictConfig.modifierChordFromState({
    alt: event.altKey,
    ctrl: config.ignoreCtrl && !expectedUsesCtrl ? false : event.ctrlKey,
    meta: event.metaKey,
    shift: event.shiftKey,
  });
}

export function matchBinding(
  bindings: readonly strictConfig.ConfiguredBinding[],
  event: ModifierEvent,
  config: { ignoreCtrl?: boolean } = {}
): strictConfig.ConfiguredBinding | null {
  return (
    bindings.find(
      (binding) =>
        binding.trigger.kind === "modifier-click" &&
        chordFromEvent(event, config, binding.trigger.chord) ===
          binding.trigger.chord
    ) ?? null
  );
}

/** Every modifier chord that reveals the outline and hover toolbar. */
export function activationModifiers(
  bindings: readonly strictConfig.ConfiguredBinding[]
): readonly strictConfig.ModifierChord[] {
  const chords = bindings.flatMap((binding) =>
    binding.trigger.kind === "modifier-click" ? [binding.trigger.chord] : []
  );
  return chords.length
    ? Array.from(new Set(chords))
    : [FALLBACK_ACTIVATION_CHORD];
}

export function matchesActivation(
  bindings: readonly strictConfig.ConfiguredBinding[],
  event: ModifierEvent
): boolean {
  const actual = chordFromEvent(event);
  return activationModifiers(bindings).some((chord) => chord === actual);
}
