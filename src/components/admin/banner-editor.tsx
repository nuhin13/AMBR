"use client";

import { useState } from "react";
import { EditSheet } from "./edit-sheet";
import { ActionForm, SubmitButton } from "./action-form";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/field";
import { saveBannerAction } from "@/modules/content/admin-actions";

export type BannerInitial = {
  id?: string; placement: "HOME_HERO" | "ANNOUNCEMENT" | "PROMO"; eyebrow: string; title: string; subtitle: string; imageAlt: string; imageDesktop: string | null; imageMobile: string | null;
  ctaLabel: string; ctaHref: string; cta2Label: string; cta2Href: string; startsAt: string; endsAt: string; sortOrder: number; isActive: boolean; campaignId: string;
};

export function BannerEditor({ initial, campaigns, isNew }: { initial: BannerInitial; campaigns: { id: string; name: string }[]; isNew?: boolean }) {
  const [placement, setPlacement] = useState(initial.placement);
  const hasImages = placement !== "ANNOUNCEMENT";
  return (
    <EditSheet title={isNew ? "New banner" : "Edit banner"} trigger={isNew ? "New banner" : "Edit"} variant={isNew ? "primary" : "ghost"}>
      {(close) => (
        <ActionForm action={saveBannerAction} className="space-y-4" onSuccess={close}>
          {initial.id && <input type="hidden" name="id" value={initial.id} />}
          <Select name="placement" label="Placement" value={placement} onChange={(e) => setPlacement(e.target.value as BannerInitial["placement"])}>
            <option value="HOME_HERO">Homepage hero</option>
            <option value="ANNOUNCEMENT">Announcement bar (top of every page)</option>
            <option value="PROMO">Promotional banner</option>
          </Select>
          {placement === "HOME_HERO" && <Input name="eyebrow" label="Small heading above title" defaultValue={initial.eyebrow} />}
          <Input name="title" label={placement === "ANNOUNCEMENT" ? "Announcement text" : "Title"} defaultValue={initial.title} required hint={placement === "HOME_HERO" ? "The last word is shown in italic rose." : undefined} />
          {placement !== "ANNOUNCEMENT" && <Textarea name="subtitle" label="Supporting text" rows={2} defaultValue={initial.subtitle} />}
          {hasImages && (
            <>
              <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                Desktop image (landscape, ~2400×1050) {initial.imageDesktop && <span className="font-normal text-muted">— current: set</span>}
                <input type="file" name="imageDesktopFile" accept="image/jpeg,image/png,image/webp,image/avif" className="text-[13px]" />
              </label>
              {initial.imageDesktop && <Checkbox name="removeDesktop" label="Remove desktop image" />}
              <label className="flex flex-col gap-1.5 text-[13px] font-medium">
                Mobile image (portrait 4:5, ~1080×1350) {initial.imageMobile && <span className="font-normal text-muted">— current: set</span>}
                <input type="file" name="imageMobileFile" accept="image/jpeg,image/png,image/webp,image/avif" className="text-[13px]" />
              </label>
              {initial.imageMobile && <Checkbox name="removeMobile" label="Remove mobile image" />}
              <Input name="imageAlt" label="Image description (alt text)" defaultValue={initial.imageAlt} />
              <p className="text-[12px] text-muted">Don&apos;t put text inside images — headlines are live text for SEO and phones.</p>
            </>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input name="ctaLabel" label="Button label" defaultValue={initial.ctaLabel} />
            <Input name="ctaHref" label="Button link" defaultValue={initial.ctaHref} placeholder="/perfumes" />
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
      )}
    </EditSheet>
  );
}
