import { allTargets } from '@locator/shared';

export function Editor() {
  return (
    <div class="mt-2">
      <label class="text-lg font-medium text-gray-900 mb-3">
        Editor links:
      </label>
      <p class="text-sm leading-5 text-gray-500"></p>
      <fieldset class="mt-2">
        <legend class="sr-only">Notification method</legend>
        <div class="space-y-2">
          {Object.entries(allTargets).map(([key, { label, url }]) => (
            <div key={key} class="flex items-center">
              <input
                id={key}
                name="notification-method"
                type="radio"
                checked={key === 'vscode'}
                class="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <label
                htmlFor={key}
                class="block ml-3 text-sm font-medium text-gray-700"
              >
                {label}
              </label>
            </div>
          ))}
          <div key={'other'} class="flex items-center">
            <input
              id={'other'}
              name="notification-method"
              type="radio"
              defaultChecked={'other' === 'vscode'}
              class="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
            />
            <label
              htmlFor={'other'}
              class="block ml-3 text-sm font-medium text-gray-700"
            >
              Custom link
            </label>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
