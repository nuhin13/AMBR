import { requirePermission } from "@/modules/auth/rbac";
import { listCategoriesAdmin } from "@/modules/catalog/admin-queries";
import { setCategoryStatusAction } from "@/modules/catalog/admin-actions";
import { PageHeader, Table, Th, Td } from "@/components/admin/ui";
import { CategoryEditor } from "@/components/admin/category-editor";
import { ActionButton } from "@/components/admin/action-form";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  await requirePermission("catalog:manage");
  const cats = await listCategoriesAdmin();
  return (
    <>
      <PageHeader
        title="Categories"
        description="Future categories (Body Mist, Car, Home, Pet, Mini, Gifts) are ready but hidden. Activate one only when it has published products and stock — until then nothing in it can be seen or bought."
        actions={<CategoryEditor isNew category={{ name: "", slug: "", type: "OTHER", tagline: null, description: null, imageUrl: null, imageAlt: null, status: "HIDDEN", sortOrder: cats.length }} />}
      />
      <Table>
        <thead><tr><Th>Category</Th><Th>Type</Th><Th align="right">Products</Th><Th>Visibility</Th><Th align="right">Actions</Th></tr></thead>
        <tbody>
          {cats.map((c) => (
            <tr key={c.id} className="hover:bg-cream-light">
              <Td>
                <span className="font-medium text-burgundy">{c.name}</span>
                <div className="text-[11.5px] text-muted">/{c.slug}{c.tagline ? ` · ${c.tagline}` : ""}</div>
              </Td>
              <Td className="text-[12.5px] lowercase">{c.type.replace("_", " ")}</Td>
              <Td align="right">{c._count.products}</Td>
              <Td><Badge tone={c.status === "ACTIVE" ? "success" : c.status === "HIDDEN" ? "outline" : "beige"}>{c.status === "ACTIVE" ? "Live" : c.status.toLowerCase()}</Badge></Td>
              <Td align="right">
                <div className="flex justify-end gap-2">
                  {c.status === "ACTIVE" ? (
                    <ActionButton action={setCategoryStatusAction} fields={{ id: c.id, status: "HIDDEN" }} variant="ghost" confirm={`Hide ${c.name}? Its products will disappear from the site.`}>Hide</ActionButton>
                  ) : (
                    <ActionButton action={setCategoryStatusAction} fields={{ id: c.id, status: "ACTIVE" }} variant="ghost" confirm={c._count.products === 0 ? `${c.name} has no products yet. Activate anyway? Customers will see an empty category.` : `Make ${c.name} live on the site?`}>Activate</ActionButton>
                  )}
                  <CategoryEditor category={c} />
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
