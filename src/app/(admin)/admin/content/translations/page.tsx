import Link from "next/link";
import { requirePermission } from "@/modules/auth/rbac";
import { listTranslationItems } from "@/modules/translations/admin-queries";
import { TR_ENTITY_LABEL, TR_ENTITY_PLURAL, type TrEntity, type TrStatus } from "@/components/admin/translation-fields";
import { PageHeader, Table, Th, Td, EmptyRow, StatCard } from "@/components/admin/ui";
import { TranslationBadge } from "@/components/admin/translation-editor";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const metadata = { title: "Translations" };

const FILTERS: { key: "" | TrStatus; label: string }[] = [
  { key: "", label: "All" },
  { key: "MISSING", label: "Missing" },
  { key: "DRAFT", label: "Draft" },
  { key: "PUBLISHED", label: "Published" },
];

export default async function TranslationsPage({ searchParams }: { searchParams: Promise<{ status?: string; type?: string }> }) {
  await requirePermission("content:manage");
  const sp = await searchParams;
  const status = (["MISSING", "DRAFT", "PUBLISHED"].includes(sp.status ?? "") ? sp.status : "") as "" | TrStatus;
  const type = (Object.keys(TR_ENTITY_LABEL).includes(sp.type ?? "") ? sp.type : "") as "" | TrEntity;
  const all = await listTranslationItems();
  const count = (s: TrStatus) => all.filter((i) => i.bnStatus === s).length;
  const rows = all.filter((i) => (!status || i.bnStatus === status) && (!type || i.entity === type));
  const href = (s: string, t: string) => {
    const p = new URLSearchParams();
    if (s) p.set("status", s);
    if (t) p.set("type", t);
    const q = p.toString();
    return `/admin/content/translations${q ? `?${q}` : ""}`;
  };
  return (
    <>
      <PageHeader
        title="Translations"
        description="Every item that has a Bangla version. Missing or draft items show their English text on the /bn site until a Bangla version is published. Nothing is translated automatically."
      />
      <div className="mb-6 grid grid-cols-3 gap-3 md:max-w-2xl">
        <StatCard label="Missing" value={count("MISSING")} href={href("MISSING", type)} />
        <StatCard label="Draft" value={count("DRAFT")} href={href("DRAFT", type)} />
        <StatCard label="Published" value={count("PUBLISHED")} href={href("PUBLISHED", type)} />
      </div>
      <div className="mb-3 flex flex-wrap gap-2" role="navigation" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <Link key={f.label} href={href(f.key, type)} aria-current={status === f.key ? "page" : undefined} className={cn("border px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.12em]", status === f.key ? "border-burgundy bg-burgundy text-cream" : "border-beige bg-white text-burgundy hover:border-burgundy")}>
            {f.label}
          </Link>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2 text-[12.5px]" role="navigation" aria-label="Filter by type">
        <Link href={href(status, "")} className={cn("underline-offset-4", !type ? "font-semibold text-burgundy underline" : "text-muted hover:text-burgundy")}>All types</Link>
        {(Object.keys(TR_ENTITY_LABEL) as TrEntity[]).map((t) => (
          <Link key={t} href={href(status, t)} className={cn("underline-offset-4", type === t ? "font-semibold text-burgundy underline" : "text-muted hover:text-burgundy")}>{TR_ENTITY_PLURAL[t]}</Link>
        ))}
      </div>
      <Table>
        <thead><tr><Th>Type</Th><Th>English title</Th><Th>English</Th><Th>বাংলা</Th><Th>Bangla updated</Th><Th /></tr></thead>
        <tbody>
          {rows.length === 0 && <EmptyRow colSpan={6}>Nothing here.</EmptyRow>}
          {rows.map((r) => (
            <tr key={`${r.entity}-${r.id}`} className="hover:bg-cream-light">
              <Td className="text-[12.5px] text-muted">{TR_ENTITY_LABEL[r.entity]}</Td>
              <Td className="max-w-[320px] truncate font-medium">{r.title}</Td>
              <Td className="text-[12.5px] capitalize">{r.enState}</Td>
              <Td><TranslationBadge status={r.bnStatus} /></Td>
              <Td className="text-[12.5px] text-muted">{r.updatedAt ? formatDateTime(r.updatedAt) : "—"}</Td>
              <Td align="right"><Link href={r.href} className="text-[12px] uppercase tracking-[0.14em] text-burgundy underline underline-offset-4">{r.bnStatus === "MISSING" ? "Translate" : "Edit"}</Link></Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
