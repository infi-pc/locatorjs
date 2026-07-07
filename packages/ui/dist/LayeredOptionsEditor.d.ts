import { JSX } from "solid-js";
import type { LocatorLayer, LocatorOptions, Targets, WriteResult } from "@locator/shared";
export type LayerTabConfig = {
    layer: LocatorLayer;
    label: string;
    values: LocatorOptions;
    /** Absent means the layer is read-only in this surface. */
    write?: (patch: Partial<LocatorOptions>) => Promise<WriteResult>;
    /** Shown at the top of the tab, e.g. why the layer is read-only or unavailable. */
    note?: string;
};
export declare function LayeredOptionsEditor(props: {
    tabs: LayerTabConfig[];
    effective: LocatorOptions;
    provenance: Partial<Record<keyof LocatorOptions, LocatorLayer>>;
    targets: Targets;
}): JSX.Element;
