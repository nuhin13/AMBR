/** All amounts are integer poisha (৳1 = 100 poisha). */

export const toPoisha = (taka: number) => Math.round(taka * 100);
export const toTaka = (poisha: number) => poisha / 100;

const fmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 0 });

/** ৳1,250 — Indian digit grouping, as used in Bangladesh. */
export function formatBDT(poisha: number): string {
  const sign = poisha < 0 ? "−" : "";
  return `${sign}৳${fmt.format(Math.abs(poisha) / 100)}`;
}

/** Percentage of an amount, rounded down to whole taka so discounts never exceed what was promised. */
export function percentOf(poisha: number, percent: number): number {
  return Math.floor((poisha * percent) / 100 / 100) * 100;
}
