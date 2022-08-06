export function OpenSettingsButton(props: {
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      on:click={() => {
        props.onClick();
      }}
      class="bg-slate-100 py-1 px-2 rounded hover:bg-slate-300 active:bg-slate-200 cursor-pointer text-xs"
    >
      {props.title || "Settings"}
    </button>
  );
}
