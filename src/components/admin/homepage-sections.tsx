"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { ActionForm, SubmitButton } from "./action-form";
import { saveHomepageSectionsAction } from "@/modules/content/admin-actions";

type S = { key: string; label: string; isEnabled: boolean; title: string | null; subtitle: string | null; titleBn: string | null; subtitleBn: string | null };

const bnStyle = { fontFamily: "var(--font-sans-bn), var(--font-montserrat), sans-serif" } as const;

export function HomepageSections({ sections }: { sections: S[] }) {
  const [order, setOrder] = useState(sections);
  const move = (i: number, d: number) => setOrder((s) => { const n = [...s]; const [x] = n.splice(i, 1); n.splice(Math.max(0, Math.min(n.length, i + d)), 0, x); return n; });
  return (
    <ActionForm action={saveHomepageSectionsAction} className="space-y-3">
      <input type="hidden" name="order" value={JSON.stringify(order.map((s) => s.key))} />
      <div className="border border-beige bg-white px-4 py-3 text-[13.5px]"><span className="font-medium">Hero banner</span> <span className="text-muted">— always first; edit it in Banners.</span></div>
      {order.map((s, i) => (
        <div key={s.key} className="border border-beige bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-3 text-[14px] font-medium">
              <input type="checkbox" name={`enabled_${s.key}`} defaultChecked={s.isEnabled} className="size-4 accent-burgundy" />
              {s.label}
            </label>
            <div className="flex gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-2 text-muted hover:text-burgundy disabled:opacity-30" aria-label={`Move ${s.label} up`}><ArrowUp className="size-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1} className="p-2 text-muted hover:text-burgundy disabled:opacity-30" aria-label={`Move ${s.label} down`}><ArrowDown className="size-4" /></button>
            </div>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            <input name={`title_${s.key}`} defaultValue={s.title ?? ""} placeholder="Custom heading (optional)" aria-label={`${s.label} heading`} className="h-10 border border-beige px-3 text-[13.5px] focus:border-burgundy focus:outline-none" />
            <input name={`subtitle_${s.key}`} defaultValue={s.subtitle ?? ""} placeholder="Custom supporting text (optional)" aria-label={`${s.label} supporting text`} className="h-10 border border-beige px-3 text-[13.5px] focus:border-burgundy focus:outline-none" />
            <input name={`titleBn_${s.key}`} defaultValue={s.titleBn ?? ""} placeholder="বাংলা শিরোনাম (ঐচ্ছিক)" lang="bn" style={bnStyle} aria-label={`${s.label} Bangla heading`} className="h-10 border border-beige px-3 text-[13.5px] focus:border-burgundy focus:outline-none" />
            <input name={`subtitleBn_${s.key}`} defaultValue={s.subtitleBn ?? ""} placeholder="বাংলা সহায়ক লেখা (ঐচ্ছিক)" lang="bn" style={bnStyle} aria-label={`${s.label} Bangla supporting text`} className="h-10 border border-beige px-3 text-[13.5px] focus:border-burgundy focus:outline-none" />
          </div>
        </div>
      ))}
      <p className="text-[12.5px] text-muted">Sections with nothing to show (e.g. reviews before you have 3 approved, or no best sellers) hide themselves automatically.</p>
      <SubmitButton>Save homepage</SubmitButton>
    </ActionForm>
  );
}
