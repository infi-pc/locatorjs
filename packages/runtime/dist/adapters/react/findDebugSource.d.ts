import { Fiber, Source } from "@locator/shared";
export declare function findDebugSource(fiber: Fiber): {
    fiber: Fiber;
    source: Source;
} | null;
