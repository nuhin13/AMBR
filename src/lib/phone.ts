/**
 * Bangladesh mobile numbers: 01[3-9] followed by 8 digits.
 * Accepts 01XXXXXXXXX, 8801XXXXXXXXX, +8801XXXXXXXXX (spaces/dashes ignored).
 */
const BD_MOBILE = /^01[3-9]\d{8}$/;

export function normalizeBDPhone(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "").replace(/^\+/, "");
  const local = digits.startsWith("880") ? digits.slice(2) : digits;
  return BD_MOBILE.test(local) ? `+88${local}` : null;
}

export function isValidBDPhone(input: string): boolean {
  return normalizeBDPhone(input) !== null;
}

/** +8801712345678 → 01712-345678 */
export function formatBDPhone(e164: string): string {
  const local = e164.replace(/^\+88/, "");
  return local.length === 11 ? `${local.slice(0, 5)}-${local.slice(5)}` : e164;
}

export const toLocalPhone = (e164: string) => e164.replace(/^\+88/, "");
