export function OptionsCloseButton(props: { onClick: () => void }) {
  return (
    <button
      class="w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
      onClick={() => props.onClick()}
    >
      <svg style={{ width: "20px", height: "20px" }} viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M13.46,12L19,17.54V19H17.54L12,13.46L6.46,19H5V17.54L10.54,12L5,6.46V5H6.46L12,10.54L17.54,5H19V6.46L13.46,12Z"
        />
      </svg>
    </button>
  );
}
