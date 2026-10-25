import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/catalog-view";
import { PageIntro } from "@/components/layout/page-intro";
import { getT } from "@/i18n/server";
import { localeAlternates } from "@/i18n/meta";

const forKey = (v: unknown) => (v === "him" ? "forHim" : v === "her" ? "forHer" : v === "unisex" ? "unisex" : null);

export async function generateMetadata(props: PageProps<"/[locale]/shop">): Promise<Metadata> {
  const { t, locale } = await getT();
  const k = forKey((await props.searchParams).for);
  const title = k ? t.catalog[`${k}Title`] : t.meta.shop;
  return { title, description: k ? t.catalog[`${k}Intro`] : t.meta.shopDescription, alternates: localeAlternates(locale, k ? `/shop?for=${(await props.searchParams).for}` : "/shop") };
}

export default async function ShopPage(props: PageProps<"/[locale]/shop">) {
  const sp = await props.searchParams;
  const { t } = await getT();
  const k = forKey(sp.for);
  return (
    <>
      <PageIntro
        crumbs={[{ href: k ? "/shop" : undefined, label: t.nav.shop }, ...(k ? [{ label: t.nav[k] }] : [])]}
        kicker={t.catalog.shopKicker}
        title={k ? t.catalog[`${k}Title`] : t.catalog.shopTitle}
        text={k ? t.catalog[`${k}Intro`] : t.catalog.shopIntro}
      />
      <div className="container-wide pb-24">
        <CatalogView searchParams={sp} basePath="/shop" />
      </div>
    </>
  );
}
