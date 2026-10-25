import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pagination({ page, pages, basePath, params }: { page: number; pages: number; basePath: string; params: Record<string, string | string[] | undefined> }) {
  if (pages <= 1) return null;
  const href = (n: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") p.set(k, Array.isArray(v) ? v.join(",") : v);
    if (n > 1) p.set("page", String(n));
    const qs = p.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  return (
    <nav aria-label="Pagination" className="mt-14 flex items-center justify-center gap-1">
      {page > 1 && <Link href={href(page - 1)} className="px-3 py-2 text-[13px] text-burgundy hover:underline">Previous</Link>}
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Link key={n} href={href(n)} aria-current={n === page ? "page" : undefined} className={cn("flex size-10 items-center justify-center text-[14px]", n === page ? "bg-burgundy text-cream" : "text-burgundy hover:bg-beige/60")}>
          {n}
        </Link>
      ))}
      {page < pages && <Link href={href(page + 1)} className="px-3 py-2 text-[13px] text-burgundy hover:underline">Next</Link>}
    </nav>
  );
}
