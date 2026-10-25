import { requirePermission } from "@/modules/auth/rbac";
import { productFormOptions } from "@/modules/catalog/admin-queries";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  await requirePermission("catalog:manage");
  const opts = await productFormOptions();
  const perfume = opts.categories.find((c) => c.slug === "perfumes") ?? opts.categories[0];
  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title="New product" description="Save as Draft first; add photos after saving, then publish." />
      <ProductForm
        categories={opts.categories}
        families={opts.families}
        occasions={opts.occasions}
        initial={{
          name: "", slug: "", categoryId: perfume?.id ?? "", shortDescription: "", description: "", productType: "", intensity: "MODERATE", seasons: [],
          applicationMethod: "", usageInstructions: "", safetyNote: "Avoid contact with eyes. Do not apply to broken or irritated skin. Test on an inconspicuous area of fabric first. Keep away from children, heat and open flames.",
          inspirationNote: "", status: "DRAFT", isBestSeller: false, isNewArrival: true, isFeatured: false, seoTitle: "", seoDescription: "", families: [], primaryFamily: "", occasions: [],
          notesTop: "", notesHeart: "", notesBase: "", longevity: "", projection: "", testMethodNote: "", testedAt: "", variants: [],
        }}
      />
    </>
  );
}
