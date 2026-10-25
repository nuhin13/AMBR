"use client";

import { useState } from "react";
import Image from "next/image";
import { ActionForm, SubmitButton } from "./action-form";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/field";
import { saveArticleAction } from "@/modules/content/admin-actions";
import { slugify } from "@/lib/utils";

export type ArticleInitial = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  coverImage: string | null;
  coverAlt: string;
  authorName: string;
  seoTitle: string;
  seoDescription: string;
  status: "DRAFT" | "PUBLISHED";
};

/** English article form. The Bangla version lives on its own tab with its own publish status. */
export function ArticleForm({ initial }: { initial: ArticleInitial }) {
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [touched, setTouched] = useState(Boolean(initial.id));
  return (
    <ActionForm
      action={saveArticleAction}
      success="Article saved"
      redirectTo={initial.id ? undefined : (d) => `/admin/content/journal/${(d as { id: string }).id}`}
      className="grid gap-6 xl:grid-cols-[1fr_340px]"
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="space-y-4 border border-beige bg-white p-4 md:p-5">
        <Input
          name="title"
          label="Title"
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!touched) setSlug(slugify(e.target.value));
          }}
        />
        <Input name="slug" label="Address (ambrbd.com/en/journal/…)" value={slug} onChange={(e) => { setSlug(e.target.value); setTouched(true); }} hint="Shared by both languages. Changing it on a published article breaks old links." />
        <Textarea name="excerpt" label="Excerpt" rows={3} required defaultValue={initial.excerpt} maxLength={400} hint="Shown on the journal list and in link previews." />
        <Textarea name="body" label="Article" rows={18} required defaultValue={initial.body} hint="Plain text with blank lines between paragraphs, or simple HTML (p, h2, h3, strong, em, ul, ol, li, a, blockquote). Avoid health or performance claims you can't support." />
      </div>
      <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <div className="space-y-4 border border-beige bg-white p-4 md:p-5">
          <Select name="status" label="English status" defaultValue={initial.status} hint="Bangla has its own status on the বাংলা tab.">
            <option value="DRAFT">Draft — not visible</option>
            <option value="PUBLISHED">Published</option>
          </Select>
          <Input name="authorName" label="Author" defaultValue={initial.authorName} placeholder="AMBR" />
          {initial.coverImage && (
            <div className="relative aspect-[3/2] w-full bg-beige">
              <Image src={initial.coverImage} alt="" fill sizes="340px" className="object-cover" />
            </div>
          )}
          <label className="flex flex-col gap-1.5 text-[13px] font-medium">
            Cover image (landscape, ≥1600 px wide)
            <input type="file" name="cover" accept="image/jpeg,image/png,image/webp,image/avif" className="text-[13px]" />
          </label>
          {initial.coverImage && <Checkbox name="removeCover" label="Remove cover image" />}
          <Input name="coverAlt" label="Cover description (alt text)" defaultValue={initial.coverAlt} />
          <SubmitButton full size="lg">{initial.id ? "Save article" : "Create article"}</SubmitButton>
        </div>
        <div className="space-y-4 border border-beige bg-white p-4 md:p-5">
          <Input name="seoTitle" label="SEO title" defaultValue={initial.seoTitle} maxLength={70} hint="Optional — defaults to the title." />
          <Textarea name="seoDescription" label="SEO description" rows={3} defaultValue={initial.seoDescription} maxLength={170} hint="Optional — defaults to the excerpt." />
        </div>
      </div>
    </ActionForm>
  );
}
