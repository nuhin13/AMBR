import { fmt } from "./config";
import type { Dictionary } from "./dictionaries/en";

/** Keys like "errors.soldOutName" or "validation.phone" into the dictionary. */
export type MessageKey = `errors.${keyof Dictionary["errors"]}` | `validation.${keyof Dictionary["validation"]}`;

/** Resolves a dictionary key (or returns plain text unchanged). Safe on server and client. */
export function translateMessage(t: Dictionary, keyOrText: string, vars?: Record<string, string | number>): string {
  const m = keyOrText.match(/^(errors|validation)\.(\w+)$/);
  if (m) {
    const ns = t[m[1] as "errors" | "validation"] as Record<string, string>;
    if (ns[m[2]]) return fmt(ns[m[2]], vars);
  }
  return vars ? fmt(keyOrText, vars) : keyOrText;
}
