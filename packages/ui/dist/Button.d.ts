import { JSX } from "solid-js";
type Variant = "primary" | "outline" | "ghost" | "danger-ghost";
type Size = "xs" | "sm" | "md";
export declare function Button(props: JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
}): JSX.Element;
export {};
