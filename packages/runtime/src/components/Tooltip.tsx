export default function Tooltip(props: {
  tooltipText?: string;
  position?: "bottom" | "left" | "right" | "top";
  children: any;
}) {
  const positionMap = {
    bottom: "-bottom-7 left-1/2 -translate-x-1/2 transform",
    left: "-left-2 top-1/2 -translate-y-1/2 -translate-x-full transform",
    right: "-right-2 top-1/2 -translate-y-1/2 translate-x-full transform",
    top: "-top-7 left-1/2 -translate-x-1/2 transform",
  };

  return (
    <div class="group/tooltip relative block">
      {props.children}
      <div
        class={
          "pointer-events-none invisible absolute z-10 whitespace-nowrap rounded bg-gray-700 px-2 py-1 text-center text-xs text-white opacity-0 transition-opacity duration-300 group-hover/tooltip:visible group-hover/tooltip:opacity-100" +
          " " +
          positionMap[props.position || "top"]
        }
        role="tooltip"
      >
        {props.tooltipText}
      </div>
    </div>
  );
}
