"use client";

import { useState } from "react";
import { EditSheet } from "./edit-sheet";
import { ActionForm, SubmitButton } from "./action-form";
import { LangTabs, TranslationEditor } from "./translation-editor";
import type { TrStatus } from "./translation-fields";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/field";
import { saveBannerAction } from "@/modules/content/admin-actions";

export type BannerPlacementKey = "HOME_HERO" | "ANNOUNCEMENT" | "PROMO" | "DISCOVERY" | "STORY";

export const BANNER_PLACEMENT_LABEL: Record<BannerPlacementKey, string> = {
  HOME_HERO: "Homepage hero",
  ANNOUNCEMENT: "Announcement bar (top of every page)",
  PROMO: "Promotional banner",
  DISCOVERY: "Homepage — discover the collections tile",
  STORY: "Homepage — brand philosophy",
};

export type BannerInitial = {
  id?: string; placement: BannerPlacementKey; eyebrow: string; title: string; subtitle: string; imageAlt: string; imageDesktop: string | null; imageMobile: string | null;
  ctaLabel: string; ctaHref: string; cta2Label: string; cta2Href: string; startsAt: string; endsAt: string; sortOrder: number; isActive: boolean; campaignId: string;
};

export type BannerTranslation = { status: TrStatus; values: Record<string, string> };

export function BannerEditor({ initial, campaigns, isNew, translation, defaultOpen }: { initial: BannerInitial; campaigns: { id: string; name: string }[]; isNew?: boolean; translation?: BannerTranslation; defaultOpen?: boolean }) {
  const [placement, setPlacement] = useState(initial.placement);
  const hasImages = placement !== "ANNOUNCEMENT";
  const hasEyebrow = placement === "HOME_HERO" || placement === "STORY";
  const tile = placement === "DISCOVERY" || placement === "STORY";
  const englishForm = (close: () => void) => (
    <ActionForm action={saveBannerAction} className="space-y-4" onSuccess={close}>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <Select name="placement" label="Placement" value={placement} onChange={(e) => setPlacement(e.target.value as BannerPlacementKey)}>
        {(Object.keys(BANNER_PLACEMENT_LABEL) as BannerPlacementKey[]).map((k) => <option key={k} value={k}>{BANNER_PLACEMENT_LABEL[k]}</option>)}
      </Select>
      {placement === "DISCOVERY" && <p className="text-[12.5px] text-muted">One tile per collection (e.g. For Him, For Her, Unisex, Attar &amp; Oils). The order sets their position in the homepage composition. Tiles without an image are shown as an elegant colour block.</p>}
      {placement === "STORY" && <p className="text-[12.5px] text-muted">The large philosophy section on the homepage: headline, a short paragraph and an atmospheric image.</p>}
      {hasEyebrow && <Input name="eyebrow" label="Small heading above title" defaultValue={initial.eyebrow} />}
      <Input name="title" label={placement === "ANNOUNCEMENT" ? "Announcement text" : "Title"} defaultValue={initial.title} required />
      {placement !== "ANNOUNCEMENT" && <Textarea name="subtitle" label="Supporting text" rows={placement === "STORY" ? 4 : 2} defaultValue={initial.subtitle} />}
      {hasImages && (
        <>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            {tile ? "Image (portrait or landscape, ≥1600 px)" : "Desktop image (landscape, ~2400×1050)"} {initial.imageDesktop && <span className="font-normal text-muted">— current: set</span>}
            <input type="file" name="imageDesktopFile" accept="image/jpeg,image/png,image/webp,image/avif" className="text-[13px]" />
          </label>
          {initial.imageDesktop && <Checkbox name="removeDesktop" label="Remove image" />}
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Mobile image (portrait 4:5, ~1080×1350){tile ? " — optional" : ""} {initial.imageMobile && <span className="font-normal text-muted">— current: set</span>}
            <input type="file" name="imageMobileFile" accept="image/jpeg,image/png,image/webp,image/avif" className="text-[13px]" />
          </label>
          {initial.imageMobile && <Checkbox name="removeMobile" label="Remove mobile image" />}
          <Input name="imageAlt" label="Image description (alt text)" defaultValue={initial.imageAlt} />
          <p className="text-[12px] text-muted">Don&apos;t put text inside images — headlines are live text for SEO, Bangla and phones.</p>
        </>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Input name="ctaLabel" label="Button label" defaultValue={initial.ctaLabel} />
        <Input name="ctaHref" label="Button link" defaultValue={initial.ctaHref} placeholder={placement === "DISCOVERY" ? "/shop?for=him" : "/perfumes"} hint="Without /en or /bn — the site adds the language." />
      </div>
      {placement === "HOME_HERO" && (
        <div className="grid grid-cols-2 gap-3">
          <Input name="cta2Label" label="Second button" defaultValue={initial.cta2Label} />
          <Input name="cta2Href" label="Second link" defaultValue={initial.cta2Href} placeholder="/attar" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Input name="startsAt" type="date" label="Show from" defaultValue={initial.startsAt} />
        <Input name="endsAt" type="date" label="Show until" defaultValue={initial.endsAt} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input name="sortOrder" type="number" label="Order" defaultValue={initial.sortOrder} hint="Lowest shows first" />
        <Select name="campaignId" label="Campaign" defaultValue={initial.campaignId}>
          <option value="">None</option>
          {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>
      <Checkbox name="isActive" label="Active" defaultChecked={initial.isActive} />
      <SubmitButton full>Save banner</SubmitButton>
    </ActionForm>
  );
  return (
    <EditSheet title={isNew ? "New banner" : "Edit banner"} trigger={isNew ? "New banner" : "Edit"} variant={isNew ? "primary" : "ghost"} defaultOpen={defaultOpen}>
      {(close) =>
        initial.id && translation ? (
          <LangTabs
            bnStatus={translation.status}
            english={englishForm(close)}
            bangla={
              <TranslationEditor
                entity="banner"
                parentId={initial.id}
                status={translation.status}
                values={translation.values}
                english={{ eyebrow: initial.eyebrow, title: initial.title, subtitle: initial.subtitle, imageAlt: initial.imageAlt, ctaLabel: initial.ctaLabel, cta2Label: initial.cta2Label }}
              />
            }
          />
        ) : (
          englishForm(close)
        )
      }
    </EditSheet>
  );
}
