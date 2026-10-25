import Link from "next/link";
import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { siteUrl } from "@/lib/env";

export type Crumb = { href?: string; label: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ href: "/", label: "Home" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="text-[12px] text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          {all.map((c, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden className="text-rose">/</span>}
              {c.href && i < all.length - 1 ? <Link href={c.href} className="hover:text-burgundy hover:underline">{c.label}</Link> : <span aria-current="page" className="text-charcoal">{c.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, ...(c.href ? { item: `${siteUrl}${c.href}` } : {}) })),
        }}
      />
    </>
  );
}

export function PageHeader({ eyebrow, title, description, crumbs, children }: { eyebrow?: string; title: ReactNode; description?: ReactNode; crumbs?: Crumb[]; children?: ReactNode }) {
  return (
    <div className="border-b border-beige bg-cream-light">
      <div className="container-x pb-10 pt-6 md:pb-14 md:pt-8">
        {crumbs && <Breadcrumbs items={crumbs} />}
        <div className="mt-8 max-w-3xl md:mt-12">
          {eyebrow && <p className="eyebrow mb-3 flex items-center gap-3 text-burgundy/80"><span className="h-px w-8 bg-gold" aria-hidden />{eyebrow}</p>}
          <h1 className="text-[36px] md:text-[54px]">{title}</h1>
          {description && <div className="mt-4 max-w-2xl text-[15.5px] text-muted md:text-[17px]">{description}</div>}
          {children}
        </div>
      </div>
    </div>
  );
}
