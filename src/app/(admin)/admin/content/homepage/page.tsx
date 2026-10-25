import { db } from "@/lib/db";
import { requirePermission } from "@/modules/auth/rbac";
import { HOMEPAGE_SECTIONS } from "@/modules/content/queries";
import { PageHeader } from "@/components/admin/ui";
import { HomepageSections } from "@/components/admin/homepage-sections";

export const metadata = { title: "Homepage" };

export default async function HomepageAdmin() {
  await requirePermission("content:manage");
  const rows = await db.homepageSection.findMany();
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const sections = HOMEPAGE_SECTIONS.map((s, i) => {
    const r = byKey.get(s.key);
    return { key: s.key, label: s.label, isEnabled: r?.isEnabled ?? true, sortOrder: r?.sortOrder ?? i, title: r?.title ?? null, subtitle: r?.subtitle ?? null, titleBn: r?.titleBn ?? null, subtitleBn: r?.subtitleBn ?? null };
  }).sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <div className="max-w-3xl">
      <PageHeader title="Homepage" description="Turn sections on or off, change their order and optionally override their headings in English and Bangla. Empty overrides use the standard wording of each language." />
      <HomepageSections sections={sections} />
    </div>
  );
}
