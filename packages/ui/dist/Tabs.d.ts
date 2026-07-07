import { JSX } from "solid-js";
export type TabItem = {
    id: string;
    label: JSX.Element;
    content: JSX.Element;
};
export declare function Tabs(props: {
    items: TabItem[];
    defaultId?: string;
    value?: string;
    onChange?: (id: string) => void;
}): JSX.Element;
