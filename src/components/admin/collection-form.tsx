"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { ActionForm, SubmitButton } from "./action-form";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/field";
import { saveCollectionAction } from "@/modules/catalog/admin-actions";

type P = { id: string; name: string; status: string };

export function CollectionForm({ initial, allProducts }: { initial: { id?: string; name: string; slug: string; description: string; imageUrl: string | null; imageAlt: string; status: string; isFeatured: boolean; sortOrder: number; productIds: string[] }; allProducts: P[] }) {
  const [selected, setSelected] = useState<string[]>(initial.productIds);
  const [pick, setPick] = useState("");
  const byId = new Map(allProducts.map((p) => [p.id, p]));
  const move = (i: number, d: number) => setSelected((s) => { const n = [...s]; const [x] = n.splice(i, 1); n.splice(Math.max(0, Math.min(n.length, i + d)), 0, x); return n; });
  return (
    <ActionForm action={saveCollectionAction} className="grid gap-6 lg:grid-cols-[1fr_380px]" redirectTo={initial.id ? undefined : (d) => `/admin/collections/${(d as { id: string }).id}`}>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {selected.map((id) => <input key={id} type="hidden" name="productIds" value={id} />)}
      <section className="space-y-4 border border-beige bg-white p-5">
        <h2 className="font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-burgundy">Products in this collection</h2>
        <div className="flex gap-2">
          <select value={pick} onChange={(e) => setPick(e.target.value)} className="h-11 min-w-0 flex-1 border border-beige bg-white px-2 text-[14px]" aria-label="Add a product">
            <option value="">Add a product…</option>
            {allProducts.filter((p) => !selected.includes(p.id)).map((p) => <option key={p.id} value={p.id}>{p.name}{p.status !== "PUBLISHED" ? ` (${p.status.toLowerCase()})` : ""}</option>)}
          </select>
          <button type="button" disabled={!pick} onClick={() => { setSelected((s) => [...s, pick]); setPick(""); }} className="h-11 border border-burgundy px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-burgundy disabled:opacity-40">Add</button>
        </div>
        {selected.length === 0 ? <p className="text-[13px] text-muted">No products yet. Empty collections are hidden on the site.</p> : (
          <ol className="divide-y divide-beige border border-beige">
            {selected.map((id, i) => (
              <li key={id} className="flex items-center justify-between gap-2 px-3 py-2 text-[13.5px]">
                <span><span className="mr-2 text-muted">{i + 1}.</span>{byId.get(id)?.name ?? "Unknown product"}</span>
                <span className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} aria-label="Move up" className="p-1.5 text-muted hover:text-burgundy"><ArrowUp className="size-3.5" /></button>
                  <button type="button" onClick={() => move(i, 1)} aria-label="Move down" className="p-1.5 text-muted hover:text-burgundy"><ArrowDown className="size-3.5" /></button>
                  <button type="button" onClick={() => setSelected((s) => s.filter((x) => x !== id))} aria-label="Remove" className="p-1.5 text-muted hover:text-error"><X className="size-3.5" /></button>
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
      <section className="space-y-4 border border-beige bg-white p-5">
        <Input name="name" label="Name" defaultValue={initial.name} required />
        <Input name="slug" label="URL slug (/collections/…)" defaultValue={initial.slug} hint="Leave empty to generate from the name." />
        <Textarea name="description" label="Description" rows={3} defaultValue={initial.description} />
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          Cover image (3:4 portrait) {initial.imageUrl && <span className="font-normal text-muted">(image set)</span>}
          <input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif" className="text-[13px]" />
        </label>
        {initial.imageUrl && <Checkbox name="removeImage" label="Remove current image" />}
        <Input name="imageAlt" label="Image alt text" defaultValue={initial.imageAlt} />
        <Select name="status" label="Visibility" defaultValue={initial.status}>
          <option value="PUBLISHED">Published</option>
          <option value="HIDDEN">Hidden</option>
        </Select>
        <Checkbox name="isFeatured" label="Feature on the homepage" defaultChecked={initial.isFeatured} />
        <Input name="sortOrder" type="number" label="Sort order" defaultValue={initial.sortOrder} />
        <SubmitButton full>Save collection</SubmitButton>
      </section>
    </ActionForm>
  );
}
