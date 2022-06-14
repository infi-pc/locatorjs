export default function SectionHeadline(props: any) {
  return (
    <label
      {...props}
      class={
        'text-lg font-medium text-gray-900 mb-3 ' +
        (props.class ? ` ${props.class}` : '')
      }
    >
      {props.children}
    </label>
  );
}
