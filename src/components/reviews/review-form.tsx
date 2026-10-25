"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { Input, Textarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { submitReviewAction } from "@/modules/reviews/actions";
import { cn } from "@/lib/utils";

export function ReviewForm({ orderItemId }: { orderItemId: string }) {
  const [rating, setRating] = useState(0);
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  if (done) return <p className="mt-3 text-[14px] text-success" role="status">{done}</p>;
  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await submitReviewAction({ orderItemId, rating, title: fd.get("title"), body: fd.get("body") });
          if (r.ok) setDone(r.message ?? "Thank you!");
          else {
            setError(r.error);
            setErrors(r.fieldErrors ?? {});
          }
        });
      }}
    >
      <fieldset>
        <legend className="mb-2 text-[13px] font-medium">Your rating</legend>
        <div className="flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)}>
              <Star className={cn("size-7 text-burgundy", n <= rating ? "fill-current" : "fill-transparent opacity-40")} strokeWidth={1.3} />
            </button>
          ))}
        </div>
        {errors.rating && <p className="mt-1 text-[13px] text-error">{errors.rating}</p>}
      </fieldset>
      <Input name="title" label="Headline (optional)" maxLength={80} />
      <Textarea name="body" label="Your review" required rows={3} error={errors.body} placeholder="How does it smell on you? When do you wear it?" />
      {error && !Object.keys(errors).length && <p className="text-[13px] text-error">{error}</p>}
      <Button type="submit" size="sm" loading={pending}>Submit review</Button>
    </form>
  );
}
