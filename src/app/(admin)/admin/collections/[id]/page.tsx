import { notFound } from "next/navigation";
import { requirePermission } from "@/modules/auth/rbac";
import { allProductsLite, getCollectionForEdit } from "@/modules/catalog/admin-queries";
import { deleteCollectionAction } from "@/modules/catalog/admin-actions";
import { PageHeader } from "@/components/admin/ui";
import { CollectionForm } from "@/components/admin/collection-form";
import { ActionButton } from "@/components/admin/action-form";
import { LangTabs, TranslationEditor } from "@/components/admin/translation-editor";
import { translationProps } from "@/modules/translations/admin-queries";

export const metadata = { title: "Collection" };

export default async function CollectionEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  await requirePermission("catalog:manage");
  const { id } = await params;
  const isNew = id === "new";
  const [c, products] = await Promise.all([isNew ? null : getCollectionForEdit(id), allProductsLite()]);
  if (!isNew && !c) notFound();
  const tr = c ? await translationProps("collection", c.id) : null;
  const sp = await searchParams;
  return (
    <>
      <PageHeader
        back={{ href: "/admin/collections", label: "Collections" }}
        title={c ? c.name : "New collection"}
        actions={c ? <ActionButton action={deleteCollectionAction} fields={{ id: c.id }} variant="ghost" className="text-error" redirectTo="/admin/collections" confirm={`Delete ${c.name}? Products are not affected.`}>Delete</ActionButton> : undefined}
      />
      <LangTabs
        initial={sp.lang === "bn" ? "bn" : "en"}
        bnStatus={tr?.status ?? "MISSING"}
        bnDisabledReason={c ? undefined : "Save the collection first, then add its Bangla version."}
        bangla={c && tr ? <div className="max-w-2xl border border-beige bg-white p-4 md:p-5"><TranslationEditor {...tr} english={{ name: c.name, description: c.description }} /></div> : null}
        english={
      <CollectionForm
        allProducts={products}
        initial={c ? { id: c.id, name: c.name, slug: c.slug, description: c.description ?? "", imageUrl: c.imageUrl, imageAlt: c.imageAlt ?? "", status: c.status, isFeatured: c.isFeatured, sortOrder: c.sortOrder, productIds: c.products.map((p) => p.productId) } : { name: "", slug: "", description: "", imageUrl: null, imageAlt: "", status: "PUBLISHED", isFeatured: false, sortOrder: 0, productIds: [] }}
      />
        }
      />
    </>
  );
}
