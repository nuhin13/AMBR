"use client";

import { EditSheet } from "./edit-sheet";
import { ActionForm, SubmitButton } from "./action-form";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/field";
import { saveCategoryAction } from "@/modules/catalog/admin-actions";

type Cat = { id?: string; name: string; slug: string; type: string; tagline: string | null; description: string | null; imageUrl: string | null; imageAlt: string | null; status: string; sortOrder: number };
const TYPES = ["PERFUME", "ATTAR", "BODY_MIST", "CAR", "HOME", "PET", "MINI", "GIFT", "OTHER"];

export function CategoryEditor({ category, isNew }: { category: Cat; isNew?: boolean }) {
  const fixed = ["perfumes", "attar"].includes(category.slug);
  return (
    <EditSheet title={isNew ? "New category" : `Edit ${category.name}`} trigger={isNew ? "New category" : "Edit"} variant={isNew ? "primary" : "ghost"}>
      {(close) => (
        <ActionForm action={saveCategoryAction} className="space-y-4" onSuccess={close}>
          {category.id && <input type="hidden" name="id" value={category.id} />}
          <Input name="name" label="Name" defaultValue={category.name} required />
          <Input name="slug" label="URL slug" defaultValue={category.slug} readOnly={fixed} hint={fixed ? "Fixed — the main menu links to this URL." : "Leave empty to generate from the name."} />
          <Select name="type" label="Type" defaultValue={category.type}>
            {TYPES.map((t) => <option key={t} value={t}>{t.replace("_", " ").toLowerCase()}</option>)}
          </Select>
          <Input name="tagline" label="Tagline" defaultValue={category.tagline ?? ""} />
          <Textarea name="description" label="Description" rows={3} defaultValue={category.description ?? ""} />
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Tile image {category.imageUrl && <span className="font-normal text-muted">(current image set)</span>}
            <input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif" className="text-[13px]" />
          </label>
          {category.imageUrl && <Checkbox name="removeImage" label="Remove current image" />}
          <Input name="imageAlt" label="Image alt text" defaultValue={category.imageAlt ?? ""} />
          <Select name="status" label="Visibility" defaultValue={category.status} hint="Hidden categories and their products are invisible on the site, in search and in the sitemap.">
            <option value="ACTIVE">Active — visible on the site</option>
            <option value="HIDDEN">Hidden — not visible</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
          <Input name="sortOrder" type="number" label="Sort order" defaultValue={category.sortOrder} />
          <SubmitButton full>Save category</SubmitButton>
        </ActionForm>
      )}
    </EditSheet>
  );
}
