import "server-only";
import { getDictionary, getRequestLocale } from "./server";
import { toLocalizedActionError } from "@/lib/i18n-errors";

/** Wraps a storefront server action body: localises any error into the visitor's language. */
export async function localizedAction<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (e) {
    const locale = await getRequestLocale();
    return toLocalizedActionError(e, getDictionary(locale), locale);
  }
}
