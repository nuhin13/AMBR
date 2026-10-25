import { notFound } from "next/navigation";
import { ContentPageView, contentMetadata } from "@/components/layout/content-page";

export const revalidate = 300;

const MAP: Record<string, string> = { shipping: "shipping-policy", returns: "return-policy", privacy: "privacy-policy", terms: "terms" };

export function generateStaticParams() {
  return Object.keys(MAP).map((slug) => ({ slug }));
}

export async function generateMetadata(props: PageProps<"/policies/[slug]">) {
  const { slug } = await props.params;
  return MAP[slug] ? contentMetadata(MAP[slug], `/policies/${slug}`) : { title: "Not found" };
}

export default async function PolicyPage(props: PageProps<"/policies/[slug]">) {
  const { slug } = await props.params;
  if (!MAP[slug]) notFound();
  return <ContentPageView slug={MAP[slug]} crumbs={[{ label: "Policies" }, { label: slug.charAt(0).toUpperCase() + slug.slice(1) }]} eyebrow="Policies" />;
}
