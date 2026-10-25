import { ZodError } from "zod";

/** Uniform return shape for server actions consumed by forms. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export class UserFacingError extends Error {
  name = "UserFacingError";
}

export function zodFieldErrors(e: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of e.issues) {
    const k = issue.path.join(".");
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

export function toActionError(e: unknown): { ok: false; error: string; fieldErrors?: Record<string, string> } {
  if (e instanceof ZodError) return { ok: false, error: "Please check the highlighted fields.", fieldErrors: zodFieldErrors(e) };
  if (e instanceof UserFacingError || (e instanceof Error && e.name === "UserFacingError")) return { ok: false, error: e.message };
  if (e instanceof Error && e.name === "RateLimitError") return { ok: false, error: e.message };
  console.error(JSON.stringify({ level: "error", msg: "action failed", error: e instanceof Error ? { message: e.message, stack: e.stack } : String(e) }));
  return { ok: false, error: "Something went wrong. Please try again." };
}
