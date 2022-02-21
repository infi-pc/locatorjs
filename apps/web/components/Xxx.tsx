import React from "react";

export type IconBaseProps = {
  size?: string | number;
  style?: React.CSSProperties;
  color?: string;
  children?: React.ReactNode;
  height?: string | number;
  width?: string | number;
} & React.SVGProps<SVGSVGElement>;

/**
 * IconBase is heavily inspired by react-icon-base form react-icons
 * we add better TS support, and removed legacy context API and prop-types
 */
const IconBase = ({
  children,
  color,
  size,
  style = {},
  width,
  height,
  ...props
}: IconBaseProps) => {
  const computedSize = size || "1em";

  const baseStyle = {};
  const styleProp = {
    verticalAlign: "middle",
    ...baseStyle,
    ...style,
  };

  const computedColor = color || style.color;
  if (computedColor) {
    styleProp.color = computedColor;
  }

  return (
    <svg
      children={children}
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
      height={height || computedSize}
      width={width || computedSize}
      {...props}
      style={styleProp}
    />
  );
};

const boo = { bobo: "bobo" };
export default function ExampleIcon(props: IconBaseProps) {
  return (
    <IconBase viewBox="0 0 24 24" {...props} {...boo} foo>
      <path d="M12,19.2C9.5,19.2 7.29,17.92 6,16C6.03,14 10,12.9 12,12.9C14,12.9 17.97,14 18,16C16.71,17.92 14.5,19.2 12,19.2M12,5A3,3 0 0,1 15,8A3,3 0 0,1 12,11A3,3 0 0,1 9,8A3,3 0 0,1 12,5M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12C22,6.47 17.5,2 12,2Z" />
    </IconBase>
  );
}
