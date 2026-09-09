import { Tabs } from "@ark-ui/solid/tabs";
import type { ComponentProps } from "solid-js";
import { createStyleContext } from "@locator/styled-system/jsx";
import { tabs } from "@locator/styled-system/recipes";

const { withProvider, withContext } = createStyleContext(tabs);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(Tabs.Root, "root");
export const List = withContext(Tabs.List, "list");
export const Trigger = withContext(Tabs.Trigger, "trigger");
export const Content = withContext(Tabs.Content, "content");
