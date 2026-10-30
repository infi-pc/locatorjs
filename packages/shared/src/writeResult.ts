import type { ConfigError } from "./config";

export type WriteFailureReason =
  | "blocked"
  | "quota"
  | "corrupt"
  | "future-version"
  | "reset-required"
  | "unknown";

export type WriteResult =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false;
      reason: WriteFailureReason;
      errors?: readonly ConfigError[];
    }>;

export type WriteResponse = WriteResult | Promise<WriteResult>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isWriteFailureReason(value: unknown): value is WriteFailureReason {
  return (
    value === "blocked" ||
    value === "quota" ||
    value === "corrupt" ||
    value === "future-version" ||
    value === "reset-required" ||
    value === "unknown"
  );
}

/** Rebuilds a write response received across an untyped messaging boundary. */
export function decodeWriteResult(value: unknown): WriteResult | null {
  if (!isPlainObject(value)) return null;
  if (value.ok === true) return Object.freeze({ ok: true });
  if (value.ok !== false) return null;
  return Object.freeze({
    ok: false,
    reason: isWriteFailureReason(value.reason) ? value.reason : "unknown",
  });
}
