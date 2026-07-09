import { ark } from "@ark-ui/solid/factory";
import type { ComponentProps } from "solid-js";
import { styled } from "@locator/styled-system/jsx";
import { badge } from "@locator/styled-system/recipes";

export type BadgeProps = ComponentProps<typeof Badge>;
export const Badge = styled(ark.div, badge);
