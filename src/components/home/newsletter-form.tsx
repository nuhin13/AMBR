"use client";

import { useState, useTransition } from "react";
import { subscribeNewsletterAction } from "@/modules/content/actions";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/utils";

/** Underlined single-field signup — used in the footer. */
export function NewsletterForm({ tone = "light", source = "footer" }: { tone?: "light" | "dark"; source?: string }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const light = tone === "light";
  return (
    <form
      className="w-full max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await subscribeNewsletterAction({ email, source });
          setMsg(r.ok ? { ok: true, text: r.message ?? "" } : { ok: false, text: r.fieldErrors?.email ?? r.error });
          if (r.ok) setEmail("");
        });
      }}
    >
      <label htmlFor={`nl-${source}`} className="sr-only">{t.newsletter.placeholder}</label>
      <div className={cn("flex items-end gap-4 border-b pb-2", light ? "border-cream/40 focus-within:border-cream" : "border-burgundy/40 focus-within:border-burgundy")}>
        <input
          id={`nl-${source}`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.newsletter.placeholder}
          className={cn("h-10 min-w-0 flex-1 bg-transparent text-[15px] focus:outline-none", light ? "text-cream placeholder:text-cream/50" : "text-charcoal placeholder:text-muted/70")}
        />
        <button type="submit" disabled={pending} className={cn("btn-text shrink-0 pb-2 text-[11.5px] font-semibold", light ? "text-gold hover:text-cream" : "text-burgundy")}>
          {pending ? t.newsletter.joining : t.newsletter.subscribe}
        </button>
      </div>
      {msg && <p className={cn("mt-3 text-[13.5px]", msg.ok ? (light ? "text-cream/80" : "text-success") : light ? "text-rose" : "text-error")} role="status">{msg.text}</p>}
    </form>
  );
}
