import type { LocatorLayer } from '@locator/shared';

const LAYER_LABELS: Record<LocatorLayer, string> = {
  default: 'default',
  team: 'team',
  'user-extension': 'extension',
  'user-origin': 'this origin',
};

const LAYER_CLASSES: Record<LocatorLayer, string> = {
  default: 'bg-gray-100 text-gray-600',
  team: 'bg-blue-100 text-blue-700',
  'user-extension': 'bg-purple-100 text-purple-700',
  'user-origin': 'bg-green-100 text-green-700',
};

export function ProvenanceBadge(props: { layer?: LocatorLayer }) {
  if (!props.layer) return null;
  return (
    <span
      class={`inline-block text-[10px] px-1.5 py-0.5 rounded ${
        LAYER_CLASSES[props.layer]
      }`}
      title={`Setting comes from: ${props.layer}`}
    >
      {LAYER_LABELS[props.layer]}
    </span>
  );
}
