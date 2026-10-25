import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog/catalog-view";
import { PageIntro } from "@/components/layout/page-intro";
import { getFamilies } from "@/modules/catalog/queries";
import { getT } from "@/i18n/server";
import { localeAlternates } from "@/i18n/meta";
import type { Locale } from "@/i18n/config";

async function family(slug: string, locale: Locale) {
  return (await getFamilies(locale)).find((f) => f.slug === slug) ?? null;
}

export async function generateMetadata(props: PageProps<"/[locale]/discover/[family]">) {
  const { locale } = await getT();
  const f = await family((await props.params).family, locale);
  if (!f) return { title: "Not found" };
  return { title: f.name, description: f.description ?? undefined, alternates: localeAlternates(locale, `/discover/${f.slug}`) };
}

export default async function FamilyPage(props: PageProps<"/[locale]/discover/[family]">) {
  const { t, locale } = await getT();
  const f = await family((await props.params).family, locale);
  if (!f) notFound();
  return (
    <>
      <PageIntro crumbs={[{ href: "/discover", label: t.nav.discover }, { label: f.name }]} kicker={t.catalog.familyKicker} title={f.name} text={f.description} />
      <div className="container-wide pb-24">
        <CatalogView searchParams={await props.searchParams} base={{ families: [f.slug] }} basePath={`/discover/${f.slug}`} hide={["family"]} />
      </div>
    </>
  );
}
