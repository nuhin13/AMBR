"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { submitReviewAction } from "@/modules/reviews/actions";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

export function ReviewForm({ orderItemId }: { orderItemId: string }) {
  const { t, fmt } = useI18n();
  const [rating, setRating] = useState(0);
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  if (done) return <p className="mt-3 text-[14px] text-success" role="status">{done}</p>;
  return (
    <form
      className="mt-5 max-w-xl space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await submitReviewAction({ orderItemId, rating, title: fd.get("title"), body: fd.get("body") });
          if (r.ok) setDone(r.message ?? "");
          else {
            setError(r.error);
            setErrors(r.fieldErrors ?? {});
          }
        });
      }}
    >
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium">{t.review.yourRating}</legend>
        <div className="flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={fmt(n === 1 ? t.review.stars_one : t.review.stars_other, { count: n })} onClick={() => setRating(n)}>
              <Star className={cn("size-7 text-burgundy transition-opacity", n <= rating ? "fill-current" : "fill-transparent opacity-35")} strokeWidth={1.2} />
            </button>
          ))}
        </div>
        {errors.rating && <p className="mt-1 text-[13px] text-error">{errors.rating}</p>}
      </fieldset>
      <Input name="title" label={t.review.headline} maxLength={80} />
      <Textarea name="body" label={t.review.body} required rows={3} error={errors.body} placeholder={t.review.bodyPlaceholder} />
      {error && !Object.keys(errors).length && <p className="text-[13px] text-error">{error}</p>}
      <Button type="submit" size="sm" loading={pending}>{t.review.submit}</Button>
    </form>
  );
}
