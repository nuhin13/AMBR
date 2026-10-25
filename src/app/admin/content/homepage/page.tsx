import { requirePermission } from "@/modules/auth/rbac";
import { getHomepageSections } from "@/modules/content/queries";
import { PageHeader } from "@/components/admin/ui";
import { HomepageSections } from "@/components/admin/homepage-sections";

export const metadata = { title: "Homepage" };

export default async function HomepageAdmin() {
  await requirePermission("content:manage");
  const sections = await getHomepageSections();
  return (
    <div className="max-w-3xl">
      <PageHeader title="Homepage" description="Turn sections on or off, change their order and optionally override their headings." />
      <HomepageSections sections={sections} />
    </div>
  );
}
