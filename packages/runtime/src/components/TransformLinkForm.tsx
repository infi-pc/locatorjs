type TransformLink = { from: string; to: string };

const defaultValue = { from: "", to: "" };

export function TransformLinkForm(props: {
  value: TransformLink | undefined;
  onChange: (val: TransformLink | undefined) => void;
}) {
  const isInvalid = () => {
    if (!props.value || !props.value.from) {
      return false;
    }
    try {
      new RegExp(`${props.value.from}`);
    } catch (x) {
      return true;
    }
    return false;
  };

  return (
    <div class="mt-2 border border-gray-200 rounded p-4 flex flex-col  gap-1">
      <div class="flex justify-between self-stretch text-sm">
        <div>Transform final link</div>
        <a
          class="underline cursor-pointer"
          onClick={() => {
            if (props.value === undefined) {
              props.onChange(defaultValue);
            } else {
              props.onChange(undefined);
            }
          }}
        >
          {props.value === undefined ? "edit" : "clear"}
        </a>
      </div>
      <div class="text-xs text-gray-700">
        In case you need to change something in the final generated link you can
        find and replace parts with Regex
      </div>
      {props.value !== undefined ? (
        <div class="py-2">
          <div class="flex gap-2">
            <div class="grow">
              <label
                for="project-path"
                class="block text-sm text-slate-700 pb-0.5 font-bold"
              >
                From (Regex)
              </label>
              <input
                id="project-path"
                value={props.value.from}
                onInput={(e) => {
                  props.onChange({
                    ...(props.value || defaultValue),
                    from: e.currentTarget.value,
                  });
                }}
                placeholder={`from regex`}
                type="text"
                name="text"
                class={
                  "shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 rounded-md"
                }
              />
            </div>
            <div class="grow">
              <label
                for="project-path"
                class="block text-sm text-slate-700 pb-0.5 font-bold"
              >
                To
              </label>
              <input
                id="project-path"
                value={props.value.to}
                onInput={(e) => {
                  props.onChange({
                    ...(props.value || defaultValue),
                    to: e.currentTarget.value,
                  });
                }}
                placeholder={`to`}
                type="text"
                name="text"
                class={
                  "shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 rounded-md"
                }
              />
            </div>
          </div>
          {isInvalid() ? (
            <div class="text-red-600 mt-1 text-sm">Regex is not valid!</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
