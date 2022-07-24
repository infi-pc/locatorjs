type Props = {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  size?: "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>;

export default function Headline(props: Props) {
  const className = `font-medium font-display text-gray-900 title-font dark:text-white text-${
    props.size || "2xl"
  } ${props.className}`;

  switch (props.as) {
    case "h1":
      return <h1 {...props} className={className} />;
    case "h2":
      return <h2 {...props} className={className} />;
    case "h3":
      return <h3 {...props} className={className} />;
    case "h4":
      return <h4 {...props} className={className} />;
    case "h5":
      return <h5 {...props} className={className} />;
    case "h6":
      return <h6 {...props} className={className} />;
    default:
      return <h1 {...props} className={className} />;
  }
}
