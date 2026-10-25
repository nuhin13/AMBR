"use client";

import Image from "next/image";
import { ArrowDown, ArrowUp, Star, Trash2 } from "lucide-react";
import { ActionForm, ActionButton, SubmitButton } from "./action-form";
import { Input } from "@/components/ui/field";
import { uploadProductImagesAction, updateProductImageAction } from "@/modules/catalog/admin-actions";

type Img = { id: string; url: string; alt: string };

export function ImageManager({ productId, images, cloudinary }: { productId: string; images: Img[]; cloudinary: boolean }) {
  return (
    <div className="space-y-5">
      {images.length === 0 ? (
        <p className="text-[13px] text-muted">No photos yet — the site shows a “Photo coming soon” placeholder. Upload real product photos (4:5 portrait, about 2000×2500 px).</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.id} className="border border-beige bg-cream-light p-2">
              <div className="relative aspect-[4/5] bg-beige">
                <Image src={img.url} alt={img.alt} fill sizes="200px" className="object-cover" />
                {i === 0 && <span className="absolute left-1.5 top-1.5 bg-burgundy px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-cream">Main</span>}
              </div>
              <ActionForm action={updateProductImageAction} className="mt-2 flex gap-1" success="Alt text saved">
                <input type="hidden" name="id" value={img.id} />
                <input type="hidden" name="op" value="alt" />
                <input name="alt" defaultValue={img.alt} aria-label="Alt text" className="h-8 min-w-0 flex-1 border border-beige bg-white px-2 text-[12px]" />
                <button className="h-8 border border-beige px-2 text-[11px] uppercase text-burgundy">Save</button>
              </ActionForm>
              <div className="mt-2 flex justify-between">
                <ActionButton action={updateProductImageAction} fields={{ id: img.id, op: "first" }} variant="ghost" size="sm" className="px-2" success="Set as main photo"><Star className="size-3.5" /><span className="sr-only">Make main</span></ActionButton>
                <ActionButton action={updateProductImageAction} fields={{ id: img.id, op: "up" }} variant="ghost" size="sm" className="px-2"><ArrowUp className="size-3.5" /><span className="sr-only">Move up</span></ActionButton>
                <ActionButton action={updateProductImageAction} fields={{ id: img.id, op: "down" }} variant="ghost" size="sm" className="px-2"><ArrowDown className="size-3.5" /><span className="sr-only">Move down</span></ActionButton>
                <ActionButton action={updateProductImageAction} fields={{ id: img.id, op: "delete" }} variant="ghost" size="sm" className="px-2 text-error" confirm="Remove this photo?"><Trash2 className="size-3.5" /><span className="sr-only">Delete</span></ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}
      <ActionForm action={uploadProductImagesAction} reset className="flex flex-col gap-3 border-t border-beige pt-4 md:flex-row md:items-end" success="Uploaded">
        <input type="hidden" name="productId" value={productId} />
        <label className="flex flex-1 flex-col gap-1.5 text-[13px] font-medium">
          Add photos
          <input type="file" name="files" accept="image/jpeg,image/png,image/webp,image/avif" multiple required className="text-[13px] file:mr-3 file:border-0 file:bg-burgundy file:px-3 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.12em] file:text-cream" />
        </label>
        <Input name="alt" label="Alt text for these photos" placeholder="e.g. Velour 30 ml perfume bottle, front" className="flex-1" />
        <SubmitButton size="sm">Upload</SubmitButton>
      </ActionForm>
      {!cloudinary && <p className="text-[12px] text-muted">Development mode: images are saved to /public/uploads. Configure Cloudinary for production.</p>}
    </div>
  );
}
