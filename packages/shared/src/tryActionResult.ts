export type TryActionResult =
  | { ok: true }
  | {
      ok: false;
      reason: "blocked" | "disabled" | "invalid-action" | "unknown";
    };

/** Rebuilds a Try-mode response received across an untyped message boundary. */
export function decodeTryActionResult(value: unknown): TryActionResult | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const candidate = value as Record<string, unknown>;
  if (candidate.ok === true) return { ok: true };
  if (candidate.ok !== false) return null;

  const reason = candidate.reason;
  return {
    ok: false,
    reason:
      reason === "blocked" ||
      reason === "disabled" ||
      reason === "invalid-action" ||
      reason === "unknown"
        ? reason
        : "unknown",
  };
}
