import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/modules/auth/rbac";
import { getProductForEdit, productFormOptions } from "@/modules/catalog/admin-queries";
import { deleteProductAction } from "@/modules/catalog/admin-actions";
import { cloudinaryConfigured } from "@/modules/media/storage";
import { takaInput, dateInput } from "@/modules/reports/form-data";
import { PageHeader, Card } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { ImageManager } from "@/components/admin/image-manager";
import { ActionButton } from "@/components/admin/action-form";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("catalog:manage");
  const { id } = await params;
  const [p, opts] = await Promise.all([getProductForEdit(id), productFormOptions()]);
  if (!p) notFound();
  const notes = (t: "TOP" | "HEART" | "BASE") => p.notes.filter((n) => n.tier === t).map((n) => n.note.name).join(", ");
  const hasOrders = p.variants.some((v) => v._count.orderItems > 0);
  const htmlToText = (h: string) => (/<(ul|ol|h2|h3|a|blockquote)\b/i.test(h) ? h : h.replace(/<\/p>\s*<p>/g, "\n\n").replace(/<br\s*\/?>/g, "\n").replace(/<\/?p>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
  return (
    <>
      <PageHeader
        back={{ href: "/admin/products", label: "Products" }}
        title={p.name}
        description={<>{p.isDemo && <Badge tone="gold" className="mr-2">Demo product</Badge>}{p.status === "PUBLISHED" ? <Link href={`/product/${p.slug}`} target="_blank" className="text-burgundy underline">View on site</Link> : "Not visible on the site"}</>}
        actions={
          <ActionButton action={deleteProductAction} fields={{ id: p.id }} variant="ghost" className="text-error" redirectTo="/admin/products" confirm={hasOrders ? `${p.name} has orders, so it will be archived (hidden) rather than deleted. Continue?` : `Permanently delete ${p.name}?`}>
            {hasOrders ? "Archive" : "Delete"}
          </ActionButton>
        }
      />
      <Card title="Photos" className="mb-6">
        <ImageManager productId={p.id} images={p.images.map((i) => ({ id: i.id, url: i.url, alt: i.alt }))} cloudinary={cloudinaryConfigured()} />
      </Card>
      <ProductForm
        categories={opts.categories}
        families={opts.families}
        occasions={opts.occasions}
        initial={{
          id: p.id, name: p.name, slug: p.slug, categoryId: p.categoryId, shortDescription: p.shortDescription, description: htmlToText(p.description), productType: p.productType,
          intensity: p.intensity, seasons: p.seasons, applicationMethod: p.applicationMethod ?? "", usageInstructions: p.usageInstructions ?? "", safetyNote: p.safetyNote ?? "",
          inspirationNote: p.inspirationNote ?? "", status: p.status, isBestSeller: p.isBestSeller, isNewArrival: p.isNewArrival, isFeatured: p.isFeatured, seoTitle: p.seoTitle ?? "",
          seoDescription: p.seoDescription ?? "", families: p.families.map((f) => f.familyId), primaryFamily: p.families.find((f) => f.isPrimary)?.familyId ?? "",
          occasions: p.occasions.map((o) => o.occasionId), notesTop: notes("TOP"), notesHeart: notes("HEART"), notesBase: notes("BASE"),
          longevity: p.performance?.longevity ?? "", projection: p.performance?.projection ?? "", testMethodNote: p.performance?.testMethodNote ?? "", testedAt: dateInput(p.performance?.testedAt),
          variants: p.variants.map((v) => ({
            id: v.id, sizeMl: String(v.sizeMl), label: v.label, sku: v.sku, price: takaInput(v.price), compareAtPrice: takaInput(v.compareAtPrice), status: v.status,
            openingStock: "0", lowStockThreshold: String(v.inventory?.lowStockThreshold ?? 5), hasOrders: v._count.orderItems > 0, onHand: v.inventory?.onHand ?? 0, reserved: v.inventory?.reserved ?? 0,
          })),
        }}
      />
    </>
  );
}
