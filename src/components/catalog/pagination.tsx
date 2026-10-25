import Link from "next/link";
import { getT } from "@/i18n/server";
import { formatNumber } from "@/i18n/format";
import { cn } from "@/lib/utils";

export async function Pagination({ page, pages, basePath, params }: { page: number; pages: number; basePath: string; params: Record<string, string | string[] | undefined> }) {
  const { t, locale } = await getT();
  if (pages <= 1) return null;
  const href = (n: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") p.set(k, Array.isArray(v) ? v.join(",") : v);
    if (n > 1) p.set("page", String(n));
    const qs = p.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav aria-label={t.catalog.pagination} className="mt-20 flex items-center justify-center gap-2">
      {page > 1 && <Link href={href(page - 1)} className="btn-text link-quiet mr-4 text-[11px] text-burgundy">{t.catalog.previous}</Link>}
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Link key={n} href={href(n)} aria-current={n === page ? "page" : undefined} className={cn("flex size-9 items-center justify-center font-serif text-[16px]", n === page ? "text-burgundy underline decoration-gold underline-offset-[6px]" : "text-burgundy/50 hover:text-burgundy")}>
          {formatNumber(n, locale)}
        </Link>
      ))}
      {page < pages && <Link href={href(page + 1)} className="btn-text link-quiet ml-4 text-[11px] text-burgundy">{t.catalog.next}</Link>}
    </nav>
  );
}
