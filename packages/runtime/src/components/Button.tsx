export function Button(props: { onClick: () => void; children: any }) {
  return (
    <button
      class="py-1 px-1 hover:bg-white/30 pointer hover:text-gray-100 rounded"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        props.onClick();
      }}
    >
      {props.children}
    </button>
  );
}
