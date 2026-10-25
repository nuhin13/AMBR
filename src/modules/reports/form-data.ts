import "server-only";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/** Helpers shared by admin server actions that receive FormData. */

export function formObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !(k in out)) out[k] = v;
  return out;
}

export const fdAll = (fd: FormData, key: string) => fd.getAll(key).filter((v): v is string => typeof v === "string" && v !== "");

export const zText = (max = 200) => z.string().trim().max(max);
export const zOptText = (max = 2000) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(max).optional());
export const zBool = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());
export const zInt = (min = 0, max = 1_000_000) => z.coerce.number().int().min(min).max(max);
export const zOptInt = (min = 0, max = 1_000_000) =>
  z.preprocess((v) => (v === "" || v === undefined || v === null ? undefined : v), z.coerce.number().int().min(min).max(max).optional());
/** "৳" amount typed by staff (may have decimals) → integer poisha. */
export const zTaka = z.preprocess(
  (v) => (typeof v === "string" ? v.replace(/[,৳\s]/g, "") : v),
  z.coerce.number().min(0, "Must be zero or more").max(10_000_000).transform((t) => Math.round(t * 100)),
);
export const zOptTaka = z.preprocess(
  (v) => (typeof v === "string" ? (v.replace(/[,৳\s]/g, "") === "" ? undefined : v.replace(/[,৳\s]/g, "")) : v),
  z.coerce.number().min(0).max(10_000_000).transform((t) => Math.round(t * 100)).optional(),
);
export const zOptDate = z.preprocess((v) => (v === "" || v === undefined ? undefined : v), z.coerce.date().optional());

/** Re-render ISR storefront pages after catalogue/content changes. */
export function revalidateStore() {
  revalidatePath("/", "layout");
}

export const takaInput = (poisha: number | null | undefined) => (poisha === null || poisha === undefined ? "" : String(poisha / 100));

export function dateInput(d: Date | null | undefined) {
  if (!d) return "";
  const local = new Date(d.getTime() + 6 * 3600_000); // Asia/Dhaka
  return local.toISOString().slice(0, 10);
}

/** Parses yyyy-mm-dd (Dhaka) into a UTC Date at the start (or end) of that Dhaka day. */
export function dhakaDay(s: string | undefined, end = false): Date | undefined {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  const d = new Date(`${s}T${end ? "23:59:59.999" : "00:00:00.000"}+06:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}
