import { cn } from "@/lib/utils";

const TIERS = [
  { key: "top", label: "Top notes", hint: "The first impression" },
  { key: "heart", label: "Heart notes", hint: "The character as it settles" },
  { key: "base", label: "Base notes", hint: "The lasting foundation" },
] as const;

/** Three-tier notes visualisation; widths step out to form a soft pyramid outline. */
export function NotesPyramid({ notes }: { notes: { top: string[]; heart: string[]; base: string[] } }) {
  const tiers = TIERS.filter((t) => notes[t.key].length > 0);
  if (tiers.length === 0) return null;
  return (
    <div className="space-y-2.5" role="list" aria-label="Fragrance notes">
      {tiers.map((t, i) => (
        <div
          key={t.key}
          role="listitem"
          className={cn(
            "mx-auto border border-gold/70 bg-cream-light px-4 py-4 text-center sm:px-6",
            i === 0 && tiers.length === 3 && "sm:w-[72%]",
            i === 1 && tiers.length === 3 && "sm:w-[86%]",
            "w-full",
          )}
        >
          <p className="eyebrow text-burgundy/80">{t.label}</p>
          <p className="mt-2 font-serif text-lg leading-snug text-burgundy md:text-xl">{notes[t.key].join(" · ")}</p>
          <p className="mt-1 text-[12px] text-muted">{t.hint}</p>
        </div>
      ))}
    </div>
  );
}
