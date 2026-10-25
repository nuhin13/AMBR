import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/catalog-view";
import { PageIntro } from "@/components/layout/page-intro";
import { getT } from "@/i18n/server";
import { fmt, localePath } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.meta.search, robots: { index: false, follow: true } };
}

export default async function SearchPage(props: PageProps<"/[locale]/search">) {
  const sp = await props.searchParams;
  const { t, locale } = await getT();
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim() ?? "";
  return (
    <>
      <PageIntro crumbs={[{ label: t.search.title }]} title={q ? fmt(t.search.resultsFor, { q }) : t.search.title}>
        <form action={localePath(locale, "/search")} role="search" className="mt-8 flex max-w-lg items-end gap-4 border-b border-burgundy/30 focus-within:border-burgundy">
          <label htmlFor="q" className="sr-only">{t.search.title}</label>
          <input id="q" name="q" defaultValue={q} placeholder={t.search.placeholder} className="h-12 flex-1 bg-transparent font-serif text-[20px] focus:outline-none" />
          <button className="btn-text h-12 text-[11px] text-burgundy">{t.search.submit}</button>
        </form>
      </PageIntro>
      <div className="container-wide pb-24">
        <CatalogView searchParams={sp} base={{ q }} basePath="/search" />
      </div>
    </>
  );
}
