"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import type { ProductCardData } from "@/modules/catalog/queries";
import { finderMatchesAction } from "@/modules/catalog/actions";
import { ProductCard } from "@/components/product/product-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string; hint?: string };
type Step = { key: "family" | "occasion" | "budget" | "presence" | "format"; question: string; options: Option[] };

const BUDGET: Record<string, Record<string, string>> = {
  under400: { max: "399" },
  "400to800": { min: "400", max: "800" },
  over800: { min: "800" },
};

/**
 * "Find your signature scent": five quick questions (family, occasion, budget, presence,
 * format). Answers become ordinary shop filters, so results always match the catalogue.
 */
export function SignatureFinder({ families, occasions, compact }: { families: Option[]; occasions: Option[]; compact?: boolean }) {
  const { t, fmt, href } = useI18n();
  const steps: Step[] = [
    { key: "family", question: t.finder.familyQ, options: families },
    { key: "occasion", question: t.finder.occasionQ, options: occasions },
    { key: "budget", question: t.finder.budgetQ, options: (["under400", "400to800", "over800"] as const).map((v) => ({ value: v, label: t.finder.budget[v] })) },
    {
      key: "presence",
      question: t.finder.presenceQ,
      options: (["soft", "moderate", "bold"] as const).map((v, i) => {
        const k = (["LIGHT", "MODERATE", "STRONG"] as const)[i];
        return { value: v, label: t.labels.intensity[k], hint: t.labels.intensityHint[k] };
      }),
    },
    {
      key: "format",
      question: t.finder.formatQ,
      options: [
        { value: "spray", label: t.labels.format.SPRAY, hint: t.finder.formatHint.SPRAY },
        { value: "roll-on", label: t.labels.format.ROLL_ON, hint: t.finder.formatHint.ROLL_ON },
      ],
    },
  ];
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<Step["key"], string>>>({});
  const [result, setResult] = useState<{ items: ProductCardData[]; total: number; query: string } | null>(null);
  const [pending, start] = useTransition();

  const toParams = (a: typeof answers) => {
    const p: Record<string, string> = {};
    if (a.family) p.family = a.family;
    if (a.occasion) p.occasion = a.occasion;
    if (a.presence) p.presence = a.presence;
    if (a.format) p.format = a.format;
    if (a.budget) Object.assign(p, BUDGET[a.budget]);
    return p;
  };
  const finish = (a: typeof answers) =>
    start(async () => {
      const params = toParams(a);
      const r = await finderMatchesAction(params);
      setResult({ ...r, query: new URLSearchParams(params).toString() });
    });
  const next = (a: typeof answers) => (i < steps.length - 1 ? setI(i + 1) : finish(a));
  const choose = (value: string) => {
    const a = { ...answers, [steps[i].key]: answers[steps[i].key] === value ? undefined : value };
    setAnswers(a);
    setTimeout(() => next(a), 220);
  };
  const restart = () => {
    setAnswers({});
    setResult(null);
    setI(0);
  };

  if (result) {
    return (
      <div aria-live="polite">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h3 className="t-h3">{t.finder.resultsTitle}</h3>
          <div className="flex items-center gap-6">
            <button onClick={restart} className="btn-text link-underline text-[11px] text-muted hover:text-burgundy">{t.finder.restart}</button>
            {result.total > 0 && <ButtonLink href={`${href("/shop")}?${result.query}`} variant="quiet">{fmt(result.total === 1 ? t.catalog.showResults_one : t.catalog.showResults_other, { count: result.total })}</ButtonLink>}
          </div>
        </div>
        {result.items.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-7">
            {result.items.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="mt-8 max-w-md text-muted">{t.catalog.emptyText}</p>
        )}
      </div>
    );
  }

  const step = steps[i];
  return (
    <div className={cn("grid gap-10", !compact && "md:grid-cols-12")}>
      <div className={cn(!compact && "md:col-span-4")}>
        <p className="eyebrow text-burgundy/70">{fmt(t.finder.step, { current: i + 1, total: steps.length })}</p>
        <div className="mt-4 flex gap-1.5" aria-hidden>
          {steps.map((s, n) => <span key={s.key} className={cn("h-px flex-1 transition-colors duration-500", n <= i ? "bg-burgundy" : "bg-burgundy/15")} />)}
        </div>
        <h3 className="t-h3 mt-8">{step.question}</h3>
        <div className="mt-8 flex items-center gap-6">
          {i > 0 && <button onClick={() => setI(i - 1)} className="btn-text link-underline text-[11px] text-muted hover:text-burgundy">{t.finder.back}</button>}
          <button onClick={() => next(answers)} className="btn-text link-underline text-[11px] text-muted hover:text-burgundy">
            {answers[step.key] ? t.finder.next : t.finder.skip}
          </button>
        </div>
      </div>
      <ul className={cn("grid gap-x-10 sm:grid-cols-2", !compact && "md:col-span-7 md:col-start-6")} role="radiogroup" aria-label={step.question}>
        {step.options.map((o) => {
          const active = answers[step.key] === o.value;
          return (
            <li key={o.value}>
              <button
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => choose(o.value)}
                className={cn("group flex w-full items-start justify-between gap-4 border-b py-4 text-left transition-colors", active ? "border-burgundy" : "border-burgundy/15 hover:border-burgundy/50")}
              >
                <span>
                  <span className={cn("block font-serif text-[21px] leading-tight transition-colors md:text-[24px]", active ? "text-burgundy" : "text-charcoal/80 group-hover:text-burgundy")}>{o.label}</span>
                  {o.hint && <span className="mt-1 block text-[13px] text-muted">{o.hint}</span>}
                </span>
                <span className={cn("mt-1 flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors", active ? "border-burgundy bg-burgundy text-cream" : "border-burgundy/25 text-transparent")}>
                  <Check className="size-3.5" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {i === steps.length - 1 && (
        <div className={cn(!compact && "md:col-span-7 md:col-start-6")}>
          <Button onClick={() => finish(answers)} loading={pending}>{t.finder.seeMatches}</Button>
        </div>
      )}
    </div>
  );
}
