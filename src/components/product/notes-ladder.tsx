import { getT } from "@/i18n/server";

/** Top / heart / base notes as an editorial ladder of hairline-separated rows (no boxes). */
export async function NotesLadder({ notes }: { notes: { top: string[]; heart: string[]; base: string[] } }) {
  const { t } = await getT();
  const tiers = [
    { key: "top", label: t.product.notesTop, hint: t.product.notesTopHint, list: notes.top },
    { key: "heart", label: t.product.notesHeart, hint: t.product.notesHeartHint, list: notes.heart },
    { key: "base", label: t.product.notesBase, hint: t.product.notesBaseHint, list: notes.base },
  ].filter((x) => x.list.length > 0);
  if (tiers.length === 0) return null;
  return (
    <dl className="divide-y divide-burgundy/12 border-y border-burgundy/12">
      {tiers.map((tier) => (
        <div key={tier.key} className="grid grid-cols-[5.5rem_1fr] items-baseline gap-4 py-5 md:grid-cols-[8rem_1fr]">
          <dt>
            <span className="eyebrow block text-burgundy/80">{tier.label}</span>
            <span className="mt-1 block text-[11.5px] leading-snug text-muted">{tier.hint}</span>
          </dt>
          <dd className="font-serif text-[20px] leading-snug text-burgundy md:text-[24px]">
            {tier.list.join(" · ")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
