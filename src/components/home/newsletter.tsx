"use client";

import { useState, useTransition } from "react";
import { subscribeNewsletterAction } from "@/modules/content/actions";
import { cn } from "@/lib/utils";

export function Newsletter({ title, subtitle, tone = "light" }: { title?: string | null; subtitle?: string | null; tone?: "light" | "beige" }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <section className={cn("section-y", tone === "beige" ? "bg-beige" : "bg-cream-light")} aria-labelledby="nl-title">
      <div className="container-x flex flex-col items-center text-center">
        <p className="eyebrow text-burgundy/80">Newsletter</p>
        <h2 id="nl-title" className="mt-3 text-[30px] md:text-[42px]">{title ?? "Join the AMBR circle"}</h2>
        <p className="mt-3 max-w-md text-muted">{subtitle ?? "New scents, restocks and members-first offers. We write rarely and never share your email."}</p>
        <form
          className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:gap-0"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await subscribeNewsletterAction({ email, source: "homepage" });
              setMsg(r.ok ? { ok: true, text: r.message ?? "Subscribed." } : { ok: false, text: r.fieldErrors?.email ?? r.error });
              if (r.ok) setEmail("");
            });
          }}
        >
          <label htmlFor="nl-email" className="sr-only">Email address</label>
          <input
            id="nl-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="h-12 flex-1 border border-beige bg-white px-4 text-[15px] focus:border-burgundy focus:outline-none sm:border-r-0"
          />
          <button type="submit" disabled={pending} className="h-12 bg-burgundy px-7 text-[12px] font-semibold uppercase tracking-[0.16em] text-cream hover:bg-burgundy-deep disabled:opacity-60">
            {pending ? "Joining…" : "Subscribe"}
          </button>
        </form>
        {msg && <p className={cn("mt-3 text-[14px]", msg.ok ? "text-success" : "text-error")} role="status">{msg.text}</p>}
      </div>
    </section>
  );
}
