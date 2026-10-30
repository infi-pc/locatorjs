import type { FrameworkId } from "./pageProbe";

/**
 * What the extension's page agent concluded about the current document, for
 * the popup to render. Published as JSON on `<html data-locator-page-status>`
 * so the isolated content-script world can read it without a message round
 * trip, and so it is still there when the popup opens later.
 *
 * The page owns that attribute and can write anything into it, so consumers
 * must go through `decodePageStatus` and treat the result as display data.
 */
export type PageStatus =
  /** Nothing decided yet: the page is still rendering or being sampled. */
  | { kind: "probing" }
  /** The client is loaded and driving the page with this adapter. */
  | { kind: "ready"; adapter: FrameworkId; frameworks: FrameworkId[] }
  /** The user turned Locator off for all sites; the client was not loaded. */
  | { kind: "disabled" }
  /** The page rendered, but nothing Locator supports is on it. */
  | { kind: "no-framework"; unsupported: string[] }
  /** A supported framework is here without its dev-only source metadata. */
  | { kind: "no-source-info"; frameworks: FrameworkId[] }
  /** The client script was requested but never ran. */
  | { kind: "client-failed"; detail: string };

export type PageStatusKind = PageStatus["kind"];

/** `dataset` key of the attribute the status is published on. */
export const PAGE_STATUS_DATASET_KEY = "locatorPageStatus";

const PAGE_STATUS_VERSION = 1;

// Listed here rather than derived from pageProbe so the content script, which
// only decodes, does not bundle the probe.
const FRAMEWORK_IDS: readonly FrameworkId[] = ["react", "vue", "svelte", "jsx"];

function isFrameworkId(value: unknown): value is FrameworkId {
  return (
    typeof value === "string" && FRAMEWORK_IDS.includes(value as FrameworkId)
  );
}

function frameworkList(value: unknown): FrameworkId[] {
  return Array.isArray(value) ? value.filter(isFrameworkId) : [];
}

function stringList(value: unknown, limit = 4): string[] {
  return Array.isArray(value)
    ? value
        .filter((entry): entry is string => typeof entry === "string")
        .slice(0, limit)
        .map((entry) => entry.slice(0, 40))
    : [];
}

export function encodePageStatus(status: PageStatus): string {
  return JSON.stringify({ v: PAGE_STATUS_VERSION, ...status });
}

/** Rebuilds a status from an attribute value or parsed object; null if unusable. */
export function decodePageStatus(value: unknown): PageStatus | null {
  let candidate: unknown = value;
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      return null;
    }
  }
  if (typeof candidate !== "object" || candidate === null) return null;
  const record = candidate as Record<string, unknown>;
  if (record.v !== PAGE_STATUS_VERSION) return null;

  switch (record.kind) {
    case "probing":
    case "disabled":
      return { kind: record.kind };
    case "ready":
      return isFrameworkId(record.adapter)
        ? {
            kind: "ready",
            adapter: record.adapter,
            frameworks: frameworkList(record.frameworks),
          }
        : null;
    case "no-framework":
      return {
        kind: "no-framework",
        unsupported: stringList(record.unsupported),
      };
    case "no-source-info":
      return {
        kind: "no-source-info",
        frameworks: frameworkList(record.frameworks),
      };
    case "client-failed":
      return {
        kind: "client-failed",
        detail:
          typeof record.detail === "string" ? record.detail.slice(0, 500) : "",
      };
    default:
      return null;
  }
}

export function writePageStatus(doc: Document, status: PageStatus): void {
  const element = doc.documentElement;
  if (!element) return;
  const encoded = encodePageStatus(status);
  if (element.dataset[PAGE_STATUS_DATASET_KEY] !== encoded) {
    element.dataset[PAGE_STATUS_DATASET_KEY] = encoded;
  }
}

export function readPageStatus(doc: Document): PageStatus | null {
  return decodePageStatus(
    doc.documentElement?.dataset[PAGE_STATUS_DATASET_KEY]
  );
}
