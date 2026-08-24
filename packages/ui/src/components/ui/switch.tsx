import { Switch } from "@ark-ui/solid/switch";
import { type ComponentProps } from "solid-js";
import { createStyleContext } from "@locator/styled-system/jsx";
import { switchRecipe } from "@locator/styled-system/recipes";

const { withProvider, withContext } = createStyleContext(switchRecipe);

export type RootProps = ComponentProps<typeof Root>;
export const Root = withProvider(Switch.Root, "root");
export const Label = withContext(Switch.Label, "label");
const Thumb = withContext(Switch.Thumb, "thumb");
export const HiddenInput = Switch.HiddenInput;

export const Control = withContext(Switch.Control, "control", {
  defaultProps: () => ({ children: <Thumb /> }),
});
