/**
 * The shared error model. Every RPC raises a bare code with SQLSTATE P0001;
 * we translate codes to sentences a person can act on.
 *
 * Errors explain what happened and what to do. They do not apologise and they
 * are never vague.
 */

export type TeregnaErrorCode =
  | "unauthenticated"
  | "not_owner"
  | "provider_inactive"
  | "invalid_transition"
  | "not_archived"
  | "too_many_open_requests"
  | "duplicate_request"
  | "invalid_item"
  | "invalid_mode"
  | "invalid_range"
  | "not_found"
  | "self_request"
  | "unknown";

/**
 * Error codes map to message KEYS, not English strings, so the same mapping
 * serves both locales. `errorMessage` needs a translator; components pass theirs.
 */
export const ERROR_KEYS: Record<TeregnaErrorCode, string> = {
  unauthenticated: "err.unauthenticated",
  not_owner: "err.not_owner",
  provider_inactive: "err.provider_inactive",
  invalid_transition: "err.invalid_transition",
  not_archived: "err.not_archived",
  too_many_open_requests: "err.too_many_open_requests",
  duplicate_request: "err.duplicate_request",
  invalid_item: "err.invalid_item",
  invalid_mode: "err.invalid_mode",
  invalid_range: "err.invalid_range",
  not_found: "err.not_found",
  self_request: "err.self_request",
  unknown: "err.unknown",
};

const KNOWN = new Set(Object.keys(ERROR_KEYS));

/** Pull the bare code out of whatever the SDK threw. */
export function errorCode(error: unknown): TeregnaErrorCode {
  if (!error) return "unknown";
  const raw =
    typeof error === "string"
      ? error
      : ((error as { message?: string })?.message ?? "");
  const code = raw.trim().split("\n")[0].trim();
  return (KNOWN.has(code) ? code : "unknown") as TeregnaErrorCode;
}

/** The message key for an error. Translate it with your `t`. */
export function errorKey(error: unknown): string {
  const code = errorCode(error);
  if (code === "unknown" && process.env.NODE_ENV === "development") {
    console.error("Unmapped error:", error);
  }
  return ERROR_KEYS[code];
}

/** A race, not a bug: two devices acting on the same request. Refetch. */
export function isRace(error: unknown): boolean {
  const code = errorCode(error);
  return code === "invalid_transition" || code === "not_archived";
}
