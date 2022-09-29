const exampleProjectPath = `/Users/MyName/MyProject`; //`C://my-projects/my-project`;

export function ProjectLinkForm(props: {
  value: string | undefined;
  onChange: (val: string | undefined) => void;
}) {
  return (
    <div class="mt-2 border border-gray-200 rounded p-4 flex flex-col gap-1">
      <div class="flex justify-between self-stretch text-sm">
        <div>Project path (prefix)</div>
        <a
          class="underline cursor-pointer"
          onClick={() => {
            if (props.value === undefined) {
              props.onChange("");
            } else {
              props.onChange(undefined);
            }
          }}
        >
          {props.value === undefined ? "edit" : "clear"}
        </a>
      </div>
      <div class="text-xs text-gray-700">
        If your framework generates relative paths, you can add a prefix to it
        to make absolute paths.
      </div>

      {props.value !== undefined ? (
        <div class="py-2 flex flex-col gap-2">
          <input
            id="project-path"
            value={props.value}
            onInput={(e) => {
              props.onChange(e.currentTarget.value);
            }}
            placeholder={`e.g. ${exampleProjectPath}`}
            type="text"
            name="text"
            class={
              "shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-300 rounded-md"
            }
          />
          <div class="text-xs text-slate-700 pt-2">
            Run <code class="bg-slate-100 rounded py-1 px-2">pwd</code> or{" "}
            <code class="bg-slate-100 rounded py-1 px-2">echo %cd%</code> to get
            the current path
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}
