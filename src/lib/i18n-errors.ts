import { ZodError } from "zod";
import { en } from "@/i18n/dictionaries/en";
import { fmt, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { translateMessage, type MessageKey } from "@/i18n/translate";

export { translateMessage, type MessageKey };
import { UserFacingError } from "./action-result";
import { toBnDigits } from "@/i18n/format";

/**
 * A customer-facing error identified by a dictionary key. Its `message` is the English text,
 * so code paths that aren't locale-aware (admin, logs) still show something sensible.
 */
export class LocalizedError extends UserFacingError {
  name = "LocalizedError";
  constructor(public key: MessageKey, public vars?: Record<string, string | number>) {
    super(translateMessage(en, key, vars));
  }
}

/** Storefront version of toActionError: messages come back in the visitor's language. */
export function toLocalizedActionError(e: unknown, t: Dictionary, locale: Locale): { ok: false; error: string; fieldErrors?: Record<string, string> } {
  // Numbers inside messages use Bangla digits on /bn (names and codes are left as they are).
  const digits = (vars?: Record<string, string | number>) =>
    vars && locale === "bn" ? Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, typeof v === "number" ? toBnDigits(String(v)) : v])) : vars;
  if (e instanceof LocalizedError) return { ok: false, error: translateMessage(t, e.key, digits(e.vars)) };
  if (e instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of e.issues) {
      const k = issue.path.join(".");
      if (!fieldErrors[k]) fieldErrors[k] = translateMessage(t, issue.message);
    }
    return { ok: false, error: t.validation.checkFields, fieldErrors };
  }
  if (e instanceof Error && e.name === "RateLimitError") {
    const retry = (e as Error & { retryAfter?: number }).retryAfter ?? 60;
    return { ok: false, error: fmt(t.errors.tooMany, digits({ minutes: Math.max(1, Math.ceil(retry / 60)) })) };
  }
  if (e instanceof UserFacingError || (e instanceof Error && e.name === "UserFacingError")) return { ok: false, error: (e as Error).message };
  console.error(JSON.stringify({ level: "error", msg: "action failed", locale, error: e instanceof Error ? { message: e.message, stack: e.stack } : String(e) }));
  return { ok: false, error: t.errors.generic };
}
