"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ActionForm, SubmitButton } from "./action-form";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { saveProductAction } from "@/modules/catalog/admin-actions";
import { slugify } from "@/lib/utils";

export type VariantRow = {
  id?: string;
  sizeMl: string;
  label: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  status: "ACTIVE" | "ARCHIVED";
  format: "SPRAY" | "ROLL_ON" | "OIL";
  openingStock: string;
  lowStockThreshold: string;
  hasOrders?: boolean;
  onHand?: number;
  reserved?: number;
};

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  productType: string;
  intensity: "LIGHT" | "MODERATE" | "STRONG";
  gender: "MASCULINE" | "FEMININE" | "UNISEX";
  seasons: string[];
  applicationMethod: string;
  usageInstructions: string;
  safetyNote: string;
  inspirationNote: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isBestSeller: boolean;
  isNewArrival: boolean;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  families: string[];
  primaryFamily: string;
  occasions: string[];
  notesTop: string;
  notesHeart: string;
  notesBase: string;
  longevity: string;
  projection: string;
  testMethodNote: string;
  testedAt: string;
  variants: VariantRow[];
};

type Opt = { id: string; name: string };

const SEASONS = [["SUMMER", "Summer"], ["MONSOON", "Monsoon"], ["WINTER", "Winter"], ["ALL_YEAR", "All year"]];

const emptyVariant = (n: number, base: string, format: VariantRow["format"] = "SPRAY"): VariantRow => ({ sizeMl: n ? String(n) : "", label: "", sku: base ? `${base}-${n || ""}ML` : "", price: "", compareAtPrice: "", status: "ACTIVE", format, openingStock: "0", lowStockThreshold: "5" });

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="border border-beige bg-white">
      <div className="border-b border-beige px-4 py-3 md:px-5">
        <h2 className="font-sans text-[13px] font-semibold uppercase tracking-[0.12em] text-burgundy">{title}</h2>
        {hint && <p className="mt-0.5 text-[12.5px] text-muted">{hint}</p>}
      </div>
      <div className="space-y-4 p-4 md:p-5">{children}</div>
    </section>
  );
}

export function ProductForm({ initial, categories, families, occasions }: { initial: ProductFormValues; categories: (Opt & { type: string; status: string })[]; families: Opt[]; occasions: Opt[] }) {
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.id));
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [variants, setVariants] = useState<VariantRow[]>(initial.variants.length ? initial.variants : [emptyVariant(0, "", categories.find((c) => c.id === initial.categoryId)?.type === "ATTAR" ? "ROLL_ON" : "SPRAY")]);
  const [fams, setFams] = useState<string[]>(initial.families);
  const [primary, setPrimary] = useState(initial.primaryFamily);
  const isAttar = categories.find((c) => c.id === categoryId)?.type === "ATTAR";
  const skuBase = slugify(name).toUpperCase().replace(/-/g, "").slice(0, 10);

  const update = (i: number, patch: Partial<VariantRow>) => setVariants((v) => v.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  const addPreset = () => {
    const presets = isAttar ? [3, 5, 10] : [10, 30];
    const existing = new Set(variants.map((v) => Number(v.sizeMl)));
    const nextSize = presets.find((p) => !existing.has(p)) ?? 0;
    setVariants((v) => [...v.filter((r) => r.sizeMl || r.sku || r.price || r.id), emptyVariant(nextSize, skuBase, isAttar ? "ROLL_ON" : "SPRAY")]);
  };

  return (
    <ActionForm action={saveProductAction} success="Product saved" redirectTo={initial.id ? undefined : (d) => `/admin/products/${(d as { id: string }).id}`} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="variantsJson" value={JSON.stringify(variants.map((v) => ({ id: v.id, sizeMl: v.sizeMl, label: v.label, sku: v.sku, price: v.price, compareAtPrice: v.compareAtPrice, status: v.status, format: v.format, openingStock: v.openingStock, lowStockThreshold: v.lowStockThreshold })))} />
      <div className="space-y-6">
        <Section title="Basics">
          <Input
            name="name"
            label="Product name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            hint="Use AMBR's own fragrance name. Don't put designer brand names in the title."
          />
          <Input name="slug" label="URL slug (ambrbd.com/product/…)" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} hint="Changing the URL of a live product breaks old links." />
          <Input name="shortDescription" label="One-line description" required defaultValue={initial.shortDescription} maxLength={220} hint="Shown on product cards." />
          <Textarea name="description" label="Full description" required rows={7} defaultValue={initial.description} hint="Plain text with blank lines between paragraphs, or simple HTML (p, strong, em, ul, li, h3, a)." />
          <Input name="inspirationNote" label="Inspiration note (optional)" defaultValue={initial.inspirationNote} hint="Keep it to a scent-profile description. Never imply affiliation with a designer brand." />
        </Section>

        <Section title="Sizes, prices & stock" hint="Prices in Taka. Compare-at is optional (shows a sale strike-through). Stock for existing sizes is changed in Inventory so every change is logged.">
          <div className="space-y-3">
            {variants.map((v, i) => (
              <div key={v.id ?? `new-${i}`} className="grid grid-cols-2 gap-3 border border-beige bg-cream-light/60 p-3 md:grid-cols-[90px_1fr_1fr_110px_110px_auto] md:items-end">
                <Input label="Size (ml)" type="number" min={1} value={v.sizeMl} onChange={(e) => update(i, { sizeMl: e.target.value, sku: v.id ? v.sku : `${skuBase}-${e.target.value}ML` })} required />
                <Input label="Label" placeholder={v.sizeMl ? `${v.sizeMl} ml` : "10 ml"} value={v.label} onChange={(e) => update(i, { label: e.target.value })} />
                <Input label="SKU" value={v.sku} onChange={(e) => update(i, { sku: e.target.value.toUpperCase() })} required />
                <Input label="Price ৳" inputMode="decimal" value={v.price} onChange={(e) => update(i, { price: e.target.value })} required />
                <Input label="Compare-at ৳" inputMode="decimal" value={v.compareAtPrice} onChange={(e) => update(i, { compareAtPrice: e.target.value })} />
                <div className="col-span-2 flex flex-wrap items-end gap-3 md:col-span-1 md:flex-nowrap">
                  <Select label="Format" value={v.format} onChange={(e) => update(i, { format: e.target.value as VariantRow["format"] })}>
                    <option value="SPRAY">Spray</option>
                    <option value="ROLL_ON">Roll-on</option>
                    <option value="OIL">Oil</option>
                  </Select>
                  <Select label="Status" value={v.status} onChange={(e) => update(i, { status: e.target.value as VariantRow["status"] })}>
                    <option value="ACTIVE">Active</option>
                    <option value="ARCHIVED">Archived</option>
                  </Select>
                  {!v.hasOrders && variants.length > 1 && (
                    <button type="button" onClick={() => setVariants((rows) => rows.filter((_, j) => j !== i))} className="mb-1 p-2.5 text-muted hover:text-error" aria-label="Remove size">
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <div className="col-span-2 grid grid-cols-2 gap-3 md:col-span-6 md:grid-cols-[160px_160px_1fr]">
                  {v.id ? (
                    <p className="col-span-2 self-end text-[12.5px] text-muted md:col-span-1">On hand {v.onHand ?? 0} · reserved {v.reserved ?? 0}{v.hasOrders ? " · has orders" : ""}</p>
                  ) : (
                    <Input label="Opening stock" type="number" min={0} value={v.openingStock} onChange={(e) => update(i, { openingStock: e.target.value })} />
                  )}
                  <Input label="Low-stock alert at" type="number" min={0} value={v.lowStockThreshold} onChange={(e) => update(i, { lowStockThreshold: e.target.value })} />
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={addPreset}><Plus className="size-4" /> Add size</Button>
        </Section>

        <Section title="Scent profile">
          <div>
            <p className="mb-2 text-[13px] font-medium">Fragrance families <span className="font-normal text-muted">(select one or more; choose the main one)</span></p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {families.map((f) => (
                <div key={f.id} className="flex items-center justify-between border border-beige px-3 py-2 text-[13.5px]">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" name="families" value={f.id} checked={fams.includes(f.id)} onChange={(e) => {
                      setFams((x) => (e.target.checked ? [...x, f.id] : x.filter((y) => y !== f.id)));
                      if (e.target.checked && !primary) setPrimary(f.id);
                    }} className="accent-burgundy" />
                    {f.name}
                  </label>
                  {fams.includes(f.id) && (
                    <label className="flex items-center gap-1 text-[11px] text-muted">
                      <input type="radio" name="primaryFamily" value={f.id} checked={primary === f.id} onChange={() => setPrimary(f.id)} className="accent-burgundy" /> main
                    </label>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Textarea name="notesTop" label="Top notes" rows={2} defaultValue={initial.notesTop} hint="Comma-separated" />
            <Textarea name="notesHeart" label="Heart notes" rows={2} defaultValue={initial.notesHeart} hint="Comma-separated" />
            <Textarea name="notesBase" label="Base notes" rows={2} defaultValue={initial.notesBase} hint="Comma-separated" />
          </div>
          <div>
            <p className="mb-2 text-[13px] font-medium">Occasions</p>
            <div className="flex flex-wrap gap-2">
              {occasions.map((o) => (
                <label key={o.id} className="flex items-center gap-2 border border-beige px-3 py-1.5 text-[13.5px]">
                  <input type="checkbox" name="occasions" value={o.id} defaultChecked={initial.occasions.includes(o.id)} className="accent-burgundy" /> {o.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[13px] font-medium">Seasons</p>
            <div className="flex flex-wrap gap-2">
              {SEASONS.map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 border border-beige px-3 py-1.5 text-[13.5px]">
                  <input type="checkbox" name="seasons" value={v} defaultChecked={initial.seasons.includes(v)} className="accent-burgundy" /> {l}
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Select name="intensity" label="Intensity (shown as presence: soft / moderate / bold)" defaultValue={initial.intensity}>
              <option value="LIGHT">Light</option>
              <option value="MODERATE">Moderate</option>
              <option value="STRONG">Strong</option>
            </Select>
            <Select name="gender" label="For" defaultValue={initial.gender} hint="Drives the For Him / For Her / Unisex pages. Unisex scents appear in all three.">
              <option value="UNISEX">Unisex</option>
              <option value="MASCULINE">For him</option>
              <option value="FEMININE">For her</option>
            </Select>
          </div>
        </Section>

        <Section title="Use & safety">
          <div className="grid gap-4 md:grid-cols-2">
            <Input name="productType" label="Product type" required defaultValue={initial.productType} placeholder={isAttar ? "Attar · Roll-on" : "Perfume · Spray"} hint="Shown on the product page. Use the accurate term for the formulation." />
            <Input name="applicationMethod" label="Application method" defaultValue={initial.applicationMethod} placeholder={isAttar ? "Roll-on" : "Spray"} />
          </div>
          <Textarea name="usageInstructions" label="Usage instructions" rows={3} defaultValue={initial.usageInstructions} />
          <Textarea name="safetyNote" label="Safety note" rows={3} defaultValue={initial.safetyNote} />
        </Section>

        <Section title="Tested performance (optional)" hint="Only fill this in if you have actually tested the fragrance. It is shown on the product page with your test note. Leave empty otherwise — nothing is shown.">
          <div className="grid gap-4 md:grid-cols-2">
            <Input name="longevity" label="Longevity" defaultValue={initial.longevity} placeholder="e.g. 6–7 hours on skin" />
            <Input name="projection" label="Projection" defaultValue={initial.projection} placeholder="e.g. Moderate — arm's length" />
          </div>
          <Textarea name="testMethodNote" label="How it was tested" rows={2} defaultValue={initial.testMethodNote} placeholder="e.g. Wear-tested by 5 staff on skin, Dhaka, October, average of results" />
          <Input name="testedAt" label="Test date" type="date" defaultValue={initial.testedAt} />
        </Section>
      </div>

      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <Section title="Publishing">
          <Select name="status" label="Status" defaultValue={initial.status} hint="Only Published products in an active category appear on the site.">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
          <Select name="categoryId" label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
            <option value="">Choose…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.status !== "ACTIVE" ? " (hidden)" : ""}</option>)}
          </Select>
          <Checkbox name="isBestSeller" label="Best seller" defaultChecked={initial.isBestSeller} />
          <Checkbox name="isNewArrival" label="New arrival" defaultChecked={initial.isNewArrival} />
          <Checkbox name="isFeatured" label="Featured" defaultChecked={initial.isFeatured} />
          <SubmitButton full size="lg">{initial.id ? "Save product" : "Create product"}</SubmitButton>
        </Section>
        <Section title="Search engines">
          <Input name="seoTitle" label="SEO title" defaultValue={initial.seoTitle} maxLength={70} hint="Optional — defaults to the product name." />
          <Textarea name="seoDescription" label="SEO description" rows={3} defaultValue={initial.seoDescription} maxLength={170} hint="Optional — defaults to the one-line description." />
        </Section>
      </div>
    </ActionForm>
  );
}
