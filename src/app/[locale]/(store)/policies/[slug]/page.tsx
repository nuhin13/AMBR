import { notFound } from "next/navigation";
import { ContentPageView, contentMetadata } from "@/components/layout/content-page";
import { getT } from "@/i18n/server";

export const revalidate = 300;

const MAP = { shipping: ["shipping-policy", "delivery"], returns: ["return-policy", "returns"], privacy: ["privacy-policy", "privacy"], terms: ["terms", "terms"] } as const;
type Key = keyof typeof MAP;
const isKey = (s: string): s is Key => s in MAP;

export function generateStaticParams() {
  return Object.keys(MAP).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/[locale]/policies/[slug]">) {
  const { slug } = await props.params;
  return isKey(slug) ? contentMetadata(MAP[slug][0], `/policies/${slug}`) : { title: "Not found" };
}

export default async function PolicyPage(props: PageProps<"/[locale]/policies/[slug]">) {
  const { slug } = await props.params;
  if (!isKey(slug)) notFound();
  const { t } = await getT();
  return <ContentPageView slug={MAP[slug][0]} crumbs={[{ label: t.pages.policies }, { label: t.footer[MAP[slug][1]] }]} kicker={t.pages.policies} />;
}
